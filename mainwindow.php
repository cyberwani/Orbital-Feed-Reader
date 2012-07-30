<div id='wprss-container'>
  <div id="commandbar" class="quicklinks">
    <script type="text/x-handlebars" >
  <ul>
    <li class="command">
      {{#view Em.Button classBinding="isActive"
        tagName="span"
        target="Wprss.selectedFeedController"
        action="update" }}
        Update Feed
      {{/view}}
    </li>
    
    <li class="command">
      {{#view Em.Button classBinding="isActive"
        tagName="span"
        target="Wprss.selectedFeedController"
        action="markAsRead" }}
        Mark all as Read
      {{/view}}
    </li>
    <li class="command">
    </li>
    <li class="command">
      {{#view Em.Button classBinding="isActive"
        tagName="span"
        target="Wprss.selectedFeedController"
        action="showRead" }}
        Show Read Items
      {{/view}}
    </li>
    {{#if Wprss.selectedEntryController.content}}
      <li class="title">
        {{Wprss.selectedEntryController.content.feed_name}}
      </li>
    {{/if}}
  </ul>
    </script>
  </div>
  <div id="y-indicator" class="does not provide funding" >
  </div>
  
  <div id="wprss-content">
    <script type="text/x-handlebars">
    {{#if Wprss.selectedFeedController.content}}
      <ul class="entries">
        {{#each Wprss.entriesController}}
          {{#view Wprss.EntriesView contentBinding="this" classBinding="content.isRead isCurrent" }}
            <li class="entry" {{bindAttr id="content.entryID"}} >
              <a {{bindAttr href="content.link"}} target="_blank">
                <h2>{{content.title}}</h2>
              </a> 
              {{#if content.author}}
                <span class="attribution">by {{{content.author}}}</span>
              {{/if}} 
              {{#if content.entered}}
                <span class="entry-time"> {{{content.entered}}}</span>
              {{/if}}
              <div class="entry-content">
                {{{content.content}}}
                
              </div>
              <div class="attributes">
                {{checkable  "content" contentBinding="content"}}
                <div class="entry-isloading" style="display:none;">
                 loading 
                </div>
              </div>
            </li>
          {{/view}}
        {{/each}}
      </ul>
      <div id="load-more">
        The magic elves are busily shoveling more info into the pipes right now.
      </div>
    {{else}}
      <div class="no-feed-displayed"><p>Whoa - there's nothing to show right now.</p> <p>Try clicking on one of the feeds on the right.</p></div>
    {{/if}}
    </script>
  </div>
<?php
require_once('feed_list.php');
?>
  
</div>
  <script type="text/x-handlebars" data-template-name="read-check">
              {{#if content.isRead}}
                Read  
              {{else }}
                Unread  
              {{/if}}

    
  </script>
  <script type="text/x-handlebars" data-template-name="command-item">
    {{commandName}}
  </script>
  <script type="text/javascript">
    var startentries = 
    <?php
      require_once('backend.php');
      $entries = WprssEntries::get(array('isRead'=>0));

      echo json_encode($entries);
    ?>;
    
  </script>
