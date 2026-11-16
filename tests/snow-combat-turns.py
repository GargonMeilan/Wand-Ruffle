"""Run with the patched Snowflake source and its dependencies on PYTHONPATH."""
import unittest
from types import SimpleNamespace
from unittest.mock import Mock, patch

from twisted.internet.defer import Deferred
from twisted.internet.task import Clock

from app.engine.callbacks import ActionType, CallbackHandler
from app.handlers.game.confirm import on_confirm_clicked
from app.handlers.game.rooms import on_room_to_room_complete, on_room_to_room_min_time
from app.objects.gameobject import GameObject
from app.objects.enemies import Enemy
from app.engine.grid import Grid


class CombatTurns(unittest.TestCase):
    def setUp(self):
        self.game = Mock()
        self.callbacks = self.game.callbacks = CallbackHandler(self.game)
        self.game.server.assets.by_name.return_value = SimpleNamespace(index=4)
        self.obj = GameObject(self.game, "ninja")
        self.obj.id = 1001

    def test_battle_loaded_does_not_confirm_or_register_clicks_twice(self):
        for events in ((on_room_to_room_min_time, on_room_to_room_complete),
                       (on_room_to_room_complete, on_room_to_room_min_time)):
            client = Mock(in_game=True, battle_input_registered=False, is_ready=False)
            for event in events:
                event(client, {})
            on_room_to_room_complete(client, {})
            self.assertTrue(client.place_loaded)
            self.assertFalse(client.is_ready)
            client.register_input.assert_called_once()

    def test_large_enemy_is_yielded_once_and_reachable_at_its_edge(self):
        grid = Grid(9, 5, self.game)
        self.game.grid = grid
        enemy = Enemy(self.game, 3, 2)
        enemy.tile_range = 1
        grid.add(enemy)
        self.assertEqual(list(grid.objects_in_range(range(3, 4), range(2, 3))), [enemy])
        self.assertEqual(list(grid.objects_in_range(range(4, 5), range(2, 3))), [enemy])
        self.assertEqual(list(grid.objects_in_range(range(6, 7), range(2, 3))), [])

    def test_confirm_outside_planning(self):
        client = Mock(in_game=True, is_ready=False)
        client.game.timer.running = False
        on_confirm_clicked(client, {})
        self.assertFalse(client.is_ready)

    def test_loop_and_private_cue_do_not_block_next_turn(self):
        self.obj.animate_object("attack")
        first = self.callbacks.pending_animations[0]
        self.obj.animate_object("idle", play_style="loop")
        self.obj.animate_object("blank_png")
        self.obj.target = Mock()
        self.obj.animate_object("target_intro")
        waiter = Deferred.fromCoroutine(self.callbacks.wait_for_animations())
        self.assertFalse(waiter.called)
        self.callbacks.action_done(first.handle_id, self.obj.id)
        self.assertTrue(waiter.called)
        self.assertTrue(waiter.result)
        self.obj.target = self.game
        self.obj.animate_object("move")
        self.callbacks.action_done(first.handle_id, self.obj.id)
        self.assertEqual(["move"], [a.name for a in self.callbacks.pending_animations])

    def test_animation_timeout_preserves_sound_and_releases_all_waiters(self):
        clock = Clock()
        self.obj.animate_object("attack")
        sound = self.callbacks.register_action("music", ActionType.Sound, -1)
        with patch("app.engine.callbacks.reactor", clock):
            waits = [Deferred.fromCoroutine(self.callbacks.wait_for_animations(t)) for t in (2, 4)]
            clock.advance(2)
        self.assertEqual([False, False], [w.result for w in waits])
        self.assertEqual(self.callbacks.ids, [sound])


if __name__ == "__main__":
    unittest.main()
