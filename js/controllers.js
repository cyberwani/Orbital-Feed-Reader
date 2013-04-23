/* Controllers */

function FeedListCtrl($scope, $http, $log){
  $log.log('in feedscontrol');
  $scope.log = $log.log;
  $scope.info = $log.info;
  $scope.editable = false;

  /*
   * let the world know a feed has been CHOSEN
   * Mightily emit a roar up the scope chain
   */

  $scope.select = function(feed){
    $scope.log(feed.feed_id);
    if( $scope.editable){
      $scope.$emit('feedEdit',{feed: feed}); 
    }
    else{
      $scope.$emit('feedSelect', {feed: feed});
      //Mark feed as loading
    }
    //Mark feed as selected
    $scope.feeds.forEach(function(value,index){
      value.isSelected = value.feed_id == feed.feed_id
    });
  };
  $scope.requestNewFeed = function () {
    $scope.info('new feed requested');
    $scope.$emit('newFeedRequested');
  }
  /*
   * get the list of feeds and store it
   */
  $scope.refresh = function(){
    $scope.info('refreshing feeds');
    $http.get(get_url.ajaxurl+'?action=wprss_get_feeds' )
    .success(function(data){ 
      $scope.feeds = data;
    });
  };
  //call the refresh to load it all up.
  //TODO change this to load the initial feeds variable
  $scope.refresh();

  /*
   * Set editable
   */
  $scope.setEditable = function(){
    $scope.editable = ! $scope.editable;
  }

  /*
   * Has an entry changed? Update our feedlist
   */
  $scope.$on('entryChanged', function(event,args){
    //find the feed entry that has this entry's feed_id
    entry = args.entry;
    feed_id = entry.feed_id;
    for( feed in $scope.feeds){
      //$scope.info(feed);
      //$scope.info("checking does feed " + feed.feed_id + " == entry "+entry.feed_id);
      if( feed.feed_id ==  entry.feed_id){
        feed.unread_count += (entry.isRead ? -1:1);
      }
    }

    //decrement the read counter by the isread status
    $scope.log('caught entrychanged in feedCtrl');
    $scope.log(event);
    $scope.log(args);
  });

  /*
   * We should just get the feeds from the DB.
   */
  $scope.$on('refreshFeeds', function(event,args){
    $scope.refresh();
  });
}

function EntriesCtrl($scope, $http, $log){
  $scope.log = $log.log;
  $scope.info = $log.info;
  $scope.warn = $log.warn;
  $scope.error = $log.error;
  $scope.selectedEntry = null;
  $scope.currentFeedId = null;
  $scope.log("in EntriesCtrl");
  
  /*
   * select a feed to display entries from
   */
  $scope.displayFeed = function(id){
    $scope.currentFeedId = id;
    $scope.log('Getting feed '+id);
    $http.get(get_url.ajaxurl+'?action=wprss_get_entries&feed_id='+$scope.currentFeedId)
    .success(function(data){
      //$scope.info(data);
      $scope.entries = data;
      $scope.selectedEntry = null;
    });
  };

  $scope.addMoreEntries = function(){
    $http.get(get_url.ajaxurl+'?action=wprss_get_entries&feed_id='+$scope.currentFeedId)
    .success(function  (response) {
      $scope.info('going to the server mines for more delicious content');
      //$scope.info(response);
      $scope.entries = _.union($scope.entries, response);
    });
  }

  /*
   * Someone has clicked an entry.
   * Toggle read on the server, then alert the UI
   */

  $scope.selectEntry = function selectEntry(entry) {
    $scope.log('Selected entry ' + entry.entry_id);
    var newReadStatus = entry.isRead == 0?1:0;
    var data = {
      action: 'wprss_mark_item_read',
      read_status: newReadStatus ,
      entry_id: entry.entry_id,
    };
    //Set this as the selected entry
    $scope.selectedEntry = entry;
    //Mark the entry read on the server
    $http.post(get_url.ajaxurl+'?action=wprss_mark_item_read&entry_id='+entry.entry_id+'&read_status='+newReadStatus,data)
    .success(function(data){
      //mark the entry as read in the UI
      entry.isRead= entry.isRead == 0 ? 1:0;
      //tell the feed list that the entry was toggled read.
      $scope.$emit('entryChange', {entry:entry});
    });
  }
  $scope.displayFeed();
  /*
   * Catch the feedSelected event, display entries from that feed
   */
  $scope.$on('feedSelected',function(event,args){
    //$scope.log('feedSelected in Entries!');
    $scope.displayFeed(args['feed'].feed_id);
  });
  $scope.nextEntry = function(currentEntry){
    $scope.info('next entry finds the entry after the current entry, selects it');
    var index =0;//by default we select the first entry
    if( $scope.entries.length == 0){
      return;//can't select anything
    }
    if(null != currentEntry){ //if there is a current entry, get the index after it
      var index = $scope.entries.indexOf(currentEntry);
      //If we are at the last entry just go to the first
      index = (index +1) % $scope.entries.length;
    }
    var next = $scope.entries[index];
    $scope.selectEntry(next);
    //scroll to the entry
    scrollToEntry(next);
  };
  $scope.previousEntry = function (currentEntry) {
    $scope.info('prev entry finds the entry before the current entry, selects it');
    var index = $scope.entries.length;//by default we select the last entry
    if( $scope.entries.length == 0){
      return;//can't select anything
    }
    if(null != currentEntry){ //if there is a current entry, get the index after it
      index = $scope.entries.indexOf(currentEntry);
      //If we are at the last entry just go to the first
      index = Math.max((index -1),0) ;
    }
    var previous = $scope.entries[index];
    $scope.selectEntry(previous);
    //scroll to the entry
    scrollToEntry(previous);
  };

  /* Set up keyboard shortcuts
   */

  //handle the down arrow keys and j to scroll the next item to top of scren
  key('j,down',function(event,handler){
    $scope.nextEntry($scope.selectedEntry);
  });
  //up and k should scroll the previous item to the top of the screen
  key('k,up',function(event,handler){
    $scope.previousEntry($scope.selectedEntry);
  });
  //o should open the original article
  key('o',function(event,handler){
    var entry = $scope.selectedEntry;
    $scope.log(entry);
    //TODO get a canonical link - or maybe we should only store canonical links when we do inserts
    if(entry){
      window.open(entry.link);
    }
  });
  //u should toggle the current item's read status
  key('u',function(event,handler){
    var entry = $scope.selectedEntry;
    if(null == entry)
      return;
    $scope.selectEntry(entry);
  });
}

/*
 * Subscription control
 * This should manage the workflow of adding or editing a feed
 * Feed CRUD happens here.
 *
 * If you summon this with nothing in it, we'll show the feed search
 * Give it a candidate and we'll hide the rest and let you edit this
 * 
 */
function SubsCtrl($scope,$http,$log){
  $scope.log = $log.log;
  $scope.info = $log.info;

  //The normal status of this window is to be hidden.
  $scope.reveal = false;
  $scope.possibleFeeds = null;
  $scope.urlCandidate = '';
  $scope.feedCandidate = null;
  $scope.toggle = function(){
    $scope.reveal = !$scope.reveal;
    $scope.clear();
  }

  $scope.clear = function() {
    $scope.possibleFeeds = null;
    $scope.urlCandidate = '';
    $scope.feedCandidate = null;
  }

  $scope.checkUrl = function(url){
    if(url){
      $scope.urlCandidate = url;
    }
    //now we should check the candidate

    //ask the backend to look at it
    $http.post(get_url.ajaxurl+'?action=wprss_find_feed&url='+$scope.urlCandidate)
    .success(function(response){
      if("feed" == response.url_type){
        console.log('found a feed!');
        //if it returns a feed detail, display that.
        $scope.feedCandidate = { 
          feed_url: response.orig_url, 
          site_url: response.site_url, 
          feed_id: null, 
          feed_name: response.feed_name,
          unread_count:0,
          private:false
        };
        $scope.possibleFeeds=null;
      }
      else{
        //if it returns possibleFeeds, display them.
        $scope.possibleFeeds = response.feeds;
        //remove the old feedCandidate if there is one
        $scope.feedCandidate = null;
      }
    });
  }

  $scope.saveFeed = function(feed){
    //mark the save button busy
    
    $http.post(get_url.ajaxurl+'?action=wprss_save_feed&feed_id='+feed.feed_id+'&feed_url='+feed.feed_url+'&feed_name='+feed.feed_name+'&site_url='+feed.site_url+'&is_private='+feed.private, feed)
    .success(function(response){
      //mark the save button not busy
      $scope.toggle();
      $scope.feedsChanged();
    });
  }
  $scope.unsubscribe = function(feed){
    //TODO mark the button busy
    //TODO it would be good to give a cancel
    //Maybe it could just be to call the save again
    $scope.info(feed);
    $http.post(get_url.ajaxurl+'?action=wprss_unsubscribe_feed&feed_id='+feed.feed_id)
    .success(function(response){
      $scope.feedsChanged();
      //TODO unmark the busy 
      //close the dialogue
      $scope.toggle();
      $scope.feedsChanged();
    });
  }

  //this window has been requested or dismissed
  $scope.$on('subscriptionsWindow',function(event,args){
    $scope.info('subscriptionsWindow');
    //$scope.info(event);
    $scope.toggle();
  });

  $scope.feedsChanged = function(){
    $scope.$emit('feedsChanged');
  }

  //We are going to edit a feed
  //it becomes the feedCandidate so we can edit it there.
  //TODO we should copy the feed, not use the one in the feedlist
  $scope.$on('feedEditRequest', function(event,args){
    $scope.info('feedEdit');
    $scope.reveal=true;
    $scope.feedCandidate = args.feed;
  });
}

function CommandBarCtrl($scope,$http,$log){
  $scope.$on('feedSelected', function(event,args){
    $log.info('commandBar feed is:' agrs['feed'].feed_name);
    $scope.currentFeed = args.feed;
  });
  $scope.commandBarAction = function(title){
    $log.info(title + ' - not implemented yet');
    $scope.$emit(title,{feed: $scope.currentFeed});
  };
  $scope.commands = [
    { title: "Mark All As Read",
      action: $scope.commandBarAction,
    },
    { title: "Update Feed",
      action: $scope.commandBarAction,
    },
    { title: "Show Read Items",
      action: $scope.commandBarAction,
    },
  ];

}
