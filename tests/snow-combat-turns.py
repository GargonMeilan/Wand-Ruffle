"""Run with the patched Snowflake source and its dependencies on PYTHONPATH."""
import unittest
from types import SimpleNamespace
from unittest.mock import AsyncMock, Mock, patch

from twisted.internet.defer import Deferred
from twisted.internet.task import Clock

from app.engine.callbacks import ActionType, CallbackHandler
from app.engine.cards import CardObject
from app.engine.game import Game
from app.handlers.game.cards import on_card_consumed
from app.handlers.game.confirm import on_confirm_clicked
from app.handlers.game.rooms import on_room_to_room_complete, on_room_to_room_min_time
from app.objects.gameobject import GameObject
from app.objects.enemies import Enemy, Scrap, Sly, Tank
from app.engine.grid import Grid


class CombatTurns(unittest.TestCase):
    def setUp(self):
        self.game = Mock()
        self.game.grid = Grid(9, 5, self.game)
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
        grid = self.game.grid
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
        self.assertEqual(self.obj.target.send_tag.call_args.args[-2:], (-1, -1))
        self.assertEqual(self.game.send_tag.call_args.args[-2:], (-1, -1))
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

    def test_ko_fallback_uses_texture_duration_without_clearing_other_actions(self):
        for enemy_class, duration in ((Sly, 2814), (Scrap, 2948), (Tank, 2278)):
            with self.subTest(enemy=enemy_class.__name__):
                clock = Clock()
                enemy = enemy_class(self.game, 1, 1)
                enemy.id = 1002
                enemy.ko_sound = Mock()
                enemy.do_later = clock.callLater
                self.obj.animate_object("attack")
                attack, = self.callbacks.pending_animations

                enemy.ko_animation()
                defeat = self.callbacks.pending_animations[-1]
                ko_packet = self.game.send_tag.call_args_list[-2].args
                self.assertEqual(ko_packet[4], duration)
                self.assertEqual(ko_packet[-2:], (enemy.id, defeat.handle_id))
                clock.advance(duration / 1000)
                self.assertIn(defeat, self.callbacks.pending_animations)
                clock.advance(0.25)
                self.assertEqual(self.callbacks.pending_animations, [attack])
                self.callbacks.action_done(attack.handle_id, self.obj.id)

    def test_lethal_flame_does_not_queue_idle_animation(self):
        enemy = Scrap(self.game, 1, 1)
        enemy.flame = Mock(rounds_left=0)
        enemy.hp = 3
        enemy.set_health = lambda hp: setattr(enemy, "hp", hp)
        enemy.do_later = Mock()

        enemy.update_flame()

        self.assertEqual(enemy.hp, 0)
        self.assertIsNone(enemy.flame)
        enemy.do_later.assert_not_called()

    def test_power_card_is_consumed_once_without_browser_ack(self):
        client = Mock(ninja=Mock(hp=10), has_power_cards=False, power_card_slots=[])
        card = CardObject(
            Mock(id=1, name="Test", element="f"),
            client
        )
        card.object.x = card.object.y = 1
        client.selected_card = card
        client.power_card_slots.append(card)
        client.played_cards = 0
        client.game.clients = [client]
        client.game.wait_for_animations = AsyncMock()
        card.attack_animation = AsyncMock()
        card.apply_health = Mock()
        card.check_stamps = Mock()

        with patch("app.engine.cards.delay", new_callable=AsyncMock):
            self.assertIsNone(Deferred.fromCoroutine(card.use()).result)
            self.assertIsNone(Deferred.fromCoroutine(card.use()).result)

        self.assertEqual(client.power_card_slots, [])
        self.assertIsNone(client.selected_card)
        self.assertEqual(client.played_cards, 1)
        card.attack_animation.assert_awaited_once()
        card.apply_health.assert_called_once()
        client.get_window.return_value.send_payload.assert_called_with("noCards")

        client.selected_card = another_card = Mock()
        client.power_card_slots.append(another_card)
        on_card_consumed(client, {})
        self.assertIs(client.selected_card, another_card)
        self.assertEqual(client.power_card_slots, [another_card])

    def test_combo_advances_on_completion_even_without_other_window_ready(self):
        game = self.game
        one = Mock(disconnected=False, is_bot=False)
        two = Mock(disconnected=False, is_bot=False)
        game.clients = [one, two]

        waiter = Deferred.fromCoroutine(Game.display_combo_title(game, ["fire", "water"]))
        self.assertFalse(waiter.called)
        self.callbacks.event_done("comboScreenComplete", game)
        self.assertIsNone(waiter.result)
        one.get_window.return_value.load.assert_called_once()
        two.get_window.return_value.load.assert_called_once()
        two.get_window.return_value.close.assert_not_called()

    def test_combo_timeout_closes_stalled_windows(self):
        clock = Clock()
        window = Mock(client=Mock(disconnected=False))
        self.game.clients = [Mock(disconnected=False, is_bot=False)]
        self.game.clients[0].get_window.return_value = window

        with patch("app.engine.callbacks.reactor", clock):
            waiter = Deferred.fromCoroutine(Game.display_combo_title(self.game, ["fire", "snow"]))
            clock.advance(6)

        self.assertIsNone(waiter.result)
        window.close.assert_called_once()
        self.assertEqual(self.callbacks.pending_events, {})


if __name__ == "__main__":
    unittest.main()
