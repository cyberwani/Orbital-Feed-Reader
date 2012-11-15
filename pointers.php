<?php
//Check to make sure no one is trying to call this plugin directly
if ( !function_exists( 'add_action' ) ) {
  echo "Hi there!  I'm just a plugin, not much I can do when called directly.";
  exit;
}
global $tutorial_maps

/**
 * Sets up the new pointers. Calls the version compare and maps functions
 * 
 */
function show_new_pointers(){
  $tutorial_map = array(
    "menu"
  


}




?>
