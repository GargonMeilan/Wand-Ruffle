package com.clubpenguin.main {
 import flash.display.MovieClip;
 import flash.display.Loader;
 import flash.net.URLRequest;
 public class Main extends MovieClip {
  public function Main() {
   super();
   var loader:Loader = new Loader();
   addChild(loader);
   loader.load(new URLRequest("/harness.swf"));
  }
 }
}
