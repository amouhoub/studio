define(
    [
        'jquery',
        'backbone',
        'proactive/config',
        'proactive/model/CatalogWorkflowCollection'
    ],

    function ($, Backbone, config, CatalogWorkflowCollection) {

        "use strict";

        return Backbone.View.extend({

        initialize: function () {
            this.$el = $("#palette-container-div");
            if (!localStorage['secondaryBucketNames'])
                localStorage.setItem('secondaryBucketNames',"[]");
            this.options.app.models.secondaryTemplates = {};
            this.mainBucketName = '';
        },
        createMenuFromConfig: function (template, menu) {
            var that = this;

            for (var property in template) {
                if (template.hasOwnProperty(property)) {
                    if (typeof template[property] == "object") {
                        var header = $('<li role="presentation" class="dropdown-header">'+property+'</li>');
                        menu.append(header);

                        this.createMenuFromConfig(template[property], menu);
                    } else {
                    	var iconName = property.replace(/\s+/g, '');
                        var subMenu = $('<li id="'+property+'" class="sub-menu draggable ui-draggable job-element" data-toggle="tooltip" data-placement="right" title="Drag&nbsp;&&nbsp;drop&nbsp;me"><a class="" href="#" onclick="return false;"><img src="images/'+iconName+'.png"  style="width:20px;height:20px;">&nbsp;&nbsp;'+property+' </a></li>');
                        subMenu.tooltip();
                        menu.append(subMenu);
                        subMenu.data("templateName", property);
                        subMenu.data("templateUrl", template[property]);
                        subMenu.draggable({helper: "clone", scroll: true, appendTo: "#workflow-designer", opacity:0.85, zIndex: 999, containment:"#workflow-designer"});
                        subMenu.bind("drag", function(event, ui) {
                            ui.helper.css("background-color", "white");
                            ui.helper.css("padding", "3px 20px");
                        });
                        subMenu.click(function(event) {
                            // simulating drag and drop of this element
                            var workflowView = that.options.app.views.workflowView
                            workflowView.dropElement(event, {draggable:this, offset: {left: event.pageX, top: event.pageY}})
                        })
                    }
                }
            }
        },
        pinUnpin : function(){
            var menuElement = $(this).parent().parent();
            var keepFromClosing = function(){
                return false;
            };
            if(menuElement.hasClass('dropdown')){ //not pinned yet
                menuElement.removeClass('dropdown');
                menuElement.bind('hide.bs.dropdown', keepFromClosing);
                $(this).html('<img src="images/icon-unpin.png"> Unpin');
            } else { //pinned
                menuElement.addClass('dropdown');
                menuElement.unbind('hide.bs.dropdown');
                menuElement.removeClass('open');//close the dropdown
                $(this).html('<img src="images/icon-pin.png"> Pin open');
            }
        },
        setPinMenu : function(menu){
            var pinOpen = $('<li role="presentation" class="dropdown-header"><img src="images/icon-pin.png"> Pin open</li>');
            pinOpen.on('click', this.pinUnpin);
            menu.append(pinOpen);
        },
        isPalettePinned : function(){
            var lockStatus = $('#tools-table').css('position')
            return (lockStatus==='sticky'||lockStatus==='-webkit-sticky');
        },
        pinPalette : function(){
            if (this.isPalettePinned()) {
                $('#tools-table').toggleClass('unpinned');
                $('#pin-palette-button').html('<img width="14px" src="images/icon-pin.png">');
                $('.templates-menu.locked').toggleClass("locked");

            } else {
                $('#tools-table').toggleClass('unpinned');
                $('#pin-palette-button').html('<img width="14px" src="images/icon-unpin.png">');
                $('.templates-menu').toggleClass("locked");
            }
        },
        setPositionRelativeToAbsoluteEvent : function(event, ui) {
            if (this.style.position != "absolute") {
                // resetting position to absolute as it can be removed and we don't want it to move relative elements
                var leftPosition = $(this).position().left;
                this.style.position = "absolute";
                $(this).css({'left' : leftPosition});
            }
        },
        initMenu: function(menu, config) {
            menu.draggable({helper: "original", distance : 20, stop : this.setPositionRelativeToAbsoluteEvent});
            menu.addClass("dropdown");
            var menuContent = $('<ul class="dropdown-menu templates-menu locked" role="menu" aria-labelledby="dropdown-templates-menu"></ul>');
            this.setPinMenu(menuContent);
            this.createMenuFromConfig(config, menuContent);
            menu.append(menuContent);
        },
        render: function () {
            this.$el.html('');
            var taskWidget = $(
                '<span class="palette"><span id="task-menu" class="label job-element top-level-menu btn dropdown-toggle" data-toggle="dropdown">' +
                    '<img src="images/gears.png" width="20px" type="button" >Tasks<span class="caret"></span></span></span>');

            this.initMenu($(taskWidget), config.tasks);

            var manualWidget = $(
                '<span class="palette"><span class="label job-element top-level-menu btn dropdown-toggle" data-toggle="dropdown">' +
                    '<img src="images/gears.png" width="20px" type="button" >Manuals<span class="caret"></span></span></span>');

            this.initMenu($(manualWidget), config.manuals);

            var controlWidget = $(
                '<span class="palette"><span class="label job-element top-level-menu btn dropdown-toggle" data-toggle="dropdown">' +
                    '<img src="images/gears.png" width="20px" type="button" >Controls<span class="caret"></span></span></span>');

            this.initMenu($(controlWidget), config.controls);
            this.$el.append(taskWidget).append(manualWidget).append(controlWidget);

            this.renderTemplateMainBucket(this.mainBucketName);
            var localStorageTemplates = JSON.parse(localStorage.getItem('secondaryBucketNames'));
            var that = this;
            localStorageTemplates.forEach(function(secondaryBucketName) {
                that.setSecondaryTemplatesBucket(secondaryBucketName, true);
            });
        },
        checkAndGetBucketByName : function(bucketName, onPageLoad, callback){
            $.ajax({
                type: "GET",
                headers : { 'sessionID': localStorage['pa.session'] },
                async: false,
                url: '/catalog/buckets/?kind=workflow',
                success: function (data) {
                    var foundBucket = data.find(function(bucket){
                        return bucket.name.toLowerCase() == bucketName.toLowerCase();
                    });
                    callback(foundBucket);
                },

                error: function (data) {
                    if (!onPageLoad)
                        alert('The bucket "'+ bucketName + '" couldn\'t be found.');
                    else
                        console.log('The bucket "'+ bucketName + '" couldn\'t be found.');
                    return;
                }
            });
        },
        beautifyBucketName: function(bucketName){
            if (bucketName.length > 30) {
                return bucketName.substr(0,27)+'...'.replace('_',' ').replace('-',' ');
            } else {
                return bucketName.replace('_',' ').replace('-',' ');
            }
        },
        renderTemplateMainBucket : function(bucketName) {
            //rendering page title
            var nameToDisplay = this.beautifyBucketName(bucketName);
            var divBucketName = $("<div id='bucket-name-title'>"+ nameToDisplay +"</div>");
            $("#studio-bucket-title").empty();
            $("#studio-bucket-title").append(divBucketName);

            //adding palette
            var templateWidget = $(
                '<span class="main-palette palette" id="main-palette-'+bucketName+'"><span class="label job-element top-level-menu btn dropdown-toggle" data-toggle="dropdown">' +
                    '<img src="images/gears.png" width="20px" type="button" >'+ nameToDisplay +'<span class="caret"></span></span></span>');
            templateWidget.draggable({helper: "original", distance : 20, stop : this.setPositionRelativeToAbsoluteEvent});
            templateWidget.addClass("dropdown");
            var menuContent = $('<ul class="dropdown-menu templates-menu locked" role="menu" aria-labelledby="dropdown-templates-menu"></ul>');
            this.setPinMenu(menuContent);
            $(templateWidget).append(menuContent);

            var that = this;
            this.options.app.models.templates.groupByProject(function (project, templates) {
                var header = $('<li role="presentation" class="dropdown-header">'+project+'</li>');
                menuContent.append(header);
                _.each(templates, function(template) {
                    if (template.get("name")) {
                    	var iconName;
                    	var menuItem;
            			var objectKeyVal = template.get("object_key_values");
            			for (var i in objectKeyVal) {
                            if (objectKeyVal[i]["key"] == 'workflow.icon'){
            					iconName = objectKeyVal[i]["value"];
            				}
            			}
            			if (iconName)
            				menuItem = $('<li class="sub-menu draggable ui-draggable job-element" data-toggle="tooltip" data-placement="right" title="Drag&nbsp;&&nbsp;drop&nbsp;me" ><a class="" href="#" onclick="return false;"> <img src=" ' + iconName + '" width="20px"> ' + template.get("name") + '</a></li>');
            			else
            				menuItem = $('<li class="sub-menu draggable ui-draggable job-element" data-toggle="tooltip" data-placement="right" title="Drag&nbsp;&&nbsp;drop&nbsp;me" ><a class="" href="#" onclick="return false;">' + template.get("name") + '</a></li>');
                        menuItem.tooltip();
                        menuContent.append(menuItem);
                        menuItem.data("templateName", template.get("name"));
                        menuItem.data("bucketName", bucketName);
                        menuItem.draggable({helper: "clone", scroll: true, appendTo: "#workflow-designer", opacity:0.85, zIndex: 999, containment:"#workflow-designer"});
                        menuItem.bind("drag", function(event, ui) {
                            ui.helper.css("background-color", "white");
                            ui.helper.css("padding", "3px 20px");
                        });

                        menuItem.click(function(event) {
                            // simulating drag and drop of this element
                            var workflowView = that.options.app.views.workflowView
                            workflowView.dropElement(event, {draggable:this, offset: {left: event.pageX, top: event.pageY}})
                        })
                    }
                })
            }, this);
            this.$el.append(templateWidget);
        },
        setTemplateMainBucket: function(bucketName){
            var defaultBucketName = config.examples_bucket;
            if (!bucketName)
                bucketName = defaultBucketName;
            var that = this;
            this.checkAndGetBucketByName(bucketName, true, function(foundBucket){
                if (foundBucket){
                    bucketName = foundBucket.name;
                }
                else {
                    that.checkAndGetBucketByName(defaultBucketName, true, function(foundBucket){
                        if (foundBucket){
                            bucketName = foundBucket.name;
                        } else {
                            console.error("Couldn't load default main bucket "+defaultBucketName);
                        }
                    });
                }
            });

            this.mainBucketName = bucketName;

            var templates = new CatalogWorkflowCollection({bucketname : bucketName});
            templates.fetch({async : false});
            this.options.app.models.templates = templates;
            this.render();
        },
        renderSecondaryBucket : function(secondaryTemplates,bucketName){
            var nameToDisplay = this.beautifyBucketName(bucketName);
            var templateWidget = $(
                '<span class="secondary-palette palette" id="secondary-palette-'+bucketName+'"><span class="label job-element top-level-menu btn dropdown-toggle" data-toggle="dropdown">' +
                    '<img src="images/gears.png" width="20px" type="button" >'+ nameToDisplay +'<span class="caret"></span></span>'+
                    '<span class="label top-level-menu btn remove-secondary-bucket-btn" id="remove-secondary-bucket-btn-'+bucketName+'">&times;</span></span>');
            templateWidget.draggable({helper: "original", distance : 20, stop : this.setPositionRelativeToAbsoluteEvent});
            templateWidget.addClass("dropdown");
            var menuContent = $('<ul class="dropdown-menu templates-menu locked" role="menu" aria-labelledby="dropdown-secondary-templates-menu"></ul>');
            this.setPinMenu(menuContent);
            $(templateWidget).append(menuContent);
            secondaryTemplates.groupByProject(function (project, templates) {
                var header = $('<li role="presentation" class="dropdown-header">'+project+'</li>');
                menuContent.append(header);
                _.each(templates, function(template) {
                    if (template.get("name")) {
                    	var iconName;
                    	var menuItem;
            			var objectKeyVal = template.get("object_key_values");
            			for (var i in objectKeyVal) {
                            if (objectKeyVal[i]["key"] == 'workflow.icon'){
            					iconName = objectKeyVal[i]["value"];
            				}
            			}
            			if (iconName)
            				menuItem = $('<li class="sub-menu draggable ui-draggable job-element" data-toggle="tooltip" data-placement="right" title="Drag&nbsp;&&nbsp;drop&nbsp;me" ><a class="" href="#" onclick="return false;"> <img src=" ' + iconName + '" width="20px"> ' + template.get("name") + '</a></li>');
            			else
            				menuItem = $('<li class="sub-menu draggable ui-draggable job-element" data-toggle="tooltip" data-placement="right" title="Drag&nbsp;&&nbsp;drop&nbsp;me" ><a class="" href="#" onclick="return false;">' + template.get("name") + '</a></li>');
                        menuItem.tooltip();
                        menuContent.append(menuItem);
                        menuItem.data("templateName", template.get("name"));
                        menuItem.data("bucketName", bucketName);
                        menuItem.draggable({helper: "clone", scroll: true, appendTo: "#workflow-designer", opacity:0.85, zIndex: 999, containment:"#workflow-designer"});
                        menuItem.bind("drag", function(event, ui) {
                           ui.helper.css("background-color", "white");
                            ui.helper.css("padding", "3px 20px");
                        });

                        menuItem.click(function(event) {
                            // simulating drag and drop of this element
                            var workflowView = that.options.app.views.workflowView
                            workflowView.dropElement(event, {draggable:this, offset: {left: event.pageX, top: event.pageY}})
                        })
                    }
                })
            }, this);
            this.$el.append(templateWidget);
            // Add remove bucket from palette action
            var that = this;
            $('#remove-secondary-bucket-btn-'+bucketName).click(function(){
                $('#secondary-palette-'+bucketName).remove();
                var localStorageTemplates = JSON.parse(localStorage.getItem('secondaryBucketNames'));
                var index = localStorageTemplates.indexOf(bucketName);
                localStorageTemplates.splice(index, 1);
                localStorage.setItem('secondaryBucketNames', JSON.stringify(localStorageTemplates));
                delete that.options.app.models.secondaryTemplates[bucketName];
            });
        },
        setSecondaryTemplatesBucket : function(bucketName, onPageLoad) {
            if (!onPageLoad && JSON.parse(localStorage.getItem('secondaryBucketNames')).indexOf(bucketName)>-1){
                alert("The bucket "+ bucketName +" is already open.");
                return;
            }

            var foundBucketName;
            this.checkAndGetBucketByName(bucketName, onPageLoad, function(foundBucket){
                if (foundBucket)
                    foundBucketName = foundBucket.name;
                else {
                    if (!onPageLoad)
                        alert('The bucket "'+ bucketName + '" couldn\'t be found.');
                    else
                        console.log('The bucket "'+ bucketName + '" couldn\'t be found.');
                }
            });

            if(!foundBucketName)
                return;
            var secondaryTemplates = new CatalogWorkflowCollection({bucketname : foundBucketName});
            secondaryTemplates.fetch({async: false});
            this.renderSecondaryBucket(secondaryTemplates, bucketName);
            if(!onPageLoad){
                var localStorageTemplates = JSON.parse(localStorage.getItem('secondaryBucketNames'));
                localStorageTemplates.push(bucketName);
                localStorage.setItem('secondaryBucketNames', JSON.stringify(localStorageTemplates));
            }
            this.options.app.models.secondaryTemplates[bucketName] = secondaryTemplates;
        }
    })
})
