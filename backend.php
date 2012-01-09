<?php

function nonce_dance(){
  $nonce = filter_input(INPUT_GET, 'nonce_a_donce',FILTER_SANITIZE_STRING);

  // check to see if the submitted nonce matches with 
  // the generated nonce we created earlier
  if ( ! wp_verify_nonce( $nonce, 'nonce_a_donce' ) ){
      die ( 'Busted!');
  }

}  

//TODO return a nonce or something. Nonce dancing should work better

function wprss_list_feeds(){

  global $wpdb;
  global $tbl_prefix;
  //echo $tbl_prefix . " WAHEY";
  //nonce_dance();
  //TODO check to see what current user is 
  //TODO qualify this to just a user  
  $table_name = $wpdb->prefix.$tbl_prefix. "feeds";
  $sql = "select * from ".$table_name ;
  $myrows = $wpdb->get_results($sql );
  echo json_encode($myrows);
  exit;
}
add_action('wp_ajax_wprss_get_feeds','wprss_list_feeds');
add_action('wp_ajax_nopriv_wprss_get_feeds','wprss_list_feeds');

//get feed entries
function wprss_get_feed_entries(){
  global $wpdb;
  global $tbl_prefix;
  global $current_user;
  $current_user = wp_get_current_user();
  nonce_dance();
  
  $prefix = $wpdb->prefix.$tbl_prefix; 
  $feed_id = filter_input(INPUT_GET, 'feed_id', FILTER_SANITIZE_NUMBER_INT);
  $feed_qualifier ="";
  if($feed_id == ""){
    //TODO "" should mean return latest entries
   }else{
     $feed_qualifier = " and ue.feed_id = ".$feed_id;
   }

  
  //TODO change get feed entries to support non logged in use
  $sql = "select entries.id as entry_id,
      entries.title as title,
      entries.guid as guid,
      entries.link as link,
      entries.content as content,
      entries.author as author,
      ue.feed_id as feed_id
      from " . $prefix . "entries as entries
      inner join " . $prefix . "user_entries as ue
      on ue.ref_id=entries.id
      where ue.owner_uid = ". $current_user->ID."
      ".$feed_qualifier."
      limit 30
  ;";


      
  $myrows = $wpdb->get_results($sql);
  echo json_encode($myrows);
  exit;
}
add_action('wp_ajax_wprss_get_entries','wprss_get_feed_entries');
add_action('wp_ajax_nopriv_wprss_get_entries','wprss_get_feed_entries');

//update multiple feeds
function wprss_update_feeds(){
  //get the list of feeds to update that haven't been updated recently
  //TODO Limit it to a reasonable number of feeds in a batch
  //for each feed call update_feed
  

}
add_action('wp_ajax_wprss_update_feeds','wprss_update_feeds');
add_action('wp_ajax_nopriv_wprss_update_feeds','wprss_get_update_feeds');


//update single feed
function wprss_update_feed($feed_id="",$feed_url=""){
  //if we didn't get passed a feed, check to see if it is in the url
  if("" == $feed_id){
    $feed_id = filter_input(INPUT_GET, 'feed_id',FILTER_SANITIZE_NUMBER_INT);
    if("" == $feed_id){return;}
  }

  //TODO update the feeds last updated time
  require_once('simplepie.inc');
  global $wpdb;
  global $tbl_prefix;
  global $current_user;
  //echo $feed_id;
  $prefix = $wpdb->prefix.$tbl_prefix; 
  $sql = "select *
    from ". $prefix . "feeds
    where id=".$feed_id."
    ;";
  $feedrow = $wpdb->get_row($sql);

  $feed = new SimplePie();
  $feed->set_feed_url($feedrow->feed_url);
  //Here is where the feed parsing/fetching/etc. happens
  $feed->init();
  //echo json_encode($feed->get_items());
  $entries_table = $prefix."entries"; 
  $user_entries_table = $prefix."user_entries";
  foreach($feed->get_items() as $item)
  {
    echo $item->get_description();
    $wpdb->insert($entries_table, array(
      'title'=>$item->get_title(),
      'guid'=>$item->get_id(),
      'link'=>$item->get_link(),//TODO 
      'updated'=>date ("Y-m-d H:m:s"),
      'content'=>$item->get_content(),//TODO
      'entered' =>date ("Y-m-d H:m:s"), 
      'author' => $item->get_author()
    ));
    $entry_id = $wpdb->insert_id;


    //TODO - this needs to be generalized for multiple users
    $wpdb->insert($user_entries_table, array(
      'ref_id' => $entry_id,
      'feed_id' => $feed_id,
      'orig_feed_id' => $feed_id,
      'owner_uid' =>$current_user->ID
    ));
  }

  //echo $feedrow->feed_url;
  exit;
}
add_action('wp_ajax_wprss_update_feed','wprss_update_feed');
add_action('wp_ajax_nopriv_wprss_update_feed','wprss_get_update_feed');




?>
