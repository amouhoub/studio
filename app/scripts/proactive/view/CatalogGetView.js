define(
    [
        'underscore',
        'jquery',
        'backbone',
        'proactive/config',
        'proactive/rest/studio-client',
        'text!proactive/templates/catalog-get.html',
        'text!proactive/templates/catalog-bucket.html',
        'text!proactive/templates/catalog-get-object.html',
        'text!proactive/templates/catalog-get-revision.html',
        'text!proactive/templates/catalog-get-revision-description.html',
        'proactive/model/CatalogObjectRevisionCollection',
        'proactive/model/CatalogObjectCollection'
    ],

    function (_, $, Backbone, config, StudioClient, catalogBrowser, catalogList, catalogObject, catalogRevision, catalogRevisionDescription, CatalogObjectRevisionCollection, CatalogObjectCollection) {

    "use strict";

    return Backbone.View.extend({
        template: _.template(catalogBrowser),
        initialize: function (options) {
            this.$el = $("<div id='catalog-get-container'></div>");
            $("#catalog-get-body").append(this.$el);
            this.buckets = options.buckets;
            this.buckets.on('reset', this.updateBuckets, this);
        },
        events: {
            'click #catalog-get-buckets-table tr': 'selectBucket',
            'click #catalog-get-objects-table tr': 'selectObject',
            'click #direct-object-url-button': 'copyClipBoard',
            'click #catalog-get-revisions-table tr': 'selectRevision',
            'submit #get-object-by-name': 'filterByObjectsByName'
        },
        setKind : function(newKind, newKindLabel) {
            this.kind = newKind;
            this.kindLabel = newKindLabel;
            if (this.kind.toLowerCase() === 'all') {
                $("#catalog-get-as-new-button").hide();
                $("#catalog-get-append-button").hide();
                $("#catalog-get-import-button").hide();
                $("#catalog-get-select-button").show();
                $("#get-modal-title").text("Select an Object from the Catalog");
            } else if (this.kind.toLowerCase().indexOf('workflow') != 0) {
                //if it's not a workflow, we hide workflow import buttons and display generic import
                $("#catalog-get-as-new-button").hide();
                $("#catalog-get-append-button").hide();
                $("#catalog-get-import-button").show();
                $("#catalog-get-select-button").hide();
                if (this.kind.toLowerCase().indexOf('script') == 0) {
                    if (this.inputToImportId.indexOf('_Code') > -1) {
                        $("#get-modal-title").text("Import a Script by copy from the Catalog");
                        $("#confirm-import-object-message").text("You are about to import a script (inline) from the Catalog. If you continue it will replace and remove the current inline code.");
                    } else if (this.inputToImportId.indexOf('_Url') > -1) {
                        $("#get-modal-title").text("Import a Script by reference from the Catalog");
                        $("#confirm-import-object-message").text("You are about to import a script (reference) from the Catalog. If you continue it will replace and remove the current reference.");
                        $("#catalog-get-browse-button").hide();
                    }
                } else {
                    $("#get-modal-title").text("Import from the Catalog");
                    $("#confirm-import-object-message").text("You are about to import an object from the Catalog. If you continue it will replace and remove its current value.");
                }
            } else {
                $("#catalog-get-as-new-button").show();
                $("#catalog-get-append-button").show();
                $("#catalog-get-import-button").hide();
                $("#catalog-get-select-button").hide();
                $("#get-modal-title").text("Import a Workflow from the Catalog");
            }
        },
        setFilter: function(filterKind, filterContentType, bucketNameFilter) {
            this.filterKind = filterKind;
            this.filterContentType = filterContentType;
            this.bucketNameFilter = bucketNameFilter;
        },
        setObjectNameFilter: function(objNameFilter) {
            this.objectNameFilter = objNameFilter;
        },
        clearFilter: function(filterKind, filterContentType) {
            this.filterKind = undefined;
            this.filterContentType = undefined;
            this.bucketNameFilter = undefined;
        },
        setVarKey: function(varKey) {
            this.varKey = varKey;
        },
        setPreviousZIndex: function(previousZIndex) {
            this.previousZIndex = previousZIndex;
        },

        internalSelectBucket: function(currentBucketRow, shouldScrollToTheSelectedBucket) {
            this.$('#catalog-get-objects-table').empty();
            this.$('#catalog-get-objects-table').html("<th>Loading ....</th>");
            this.$('#catalog-get-description-container').empty();
            this.disableActionButtons(true, true);

            if (currentBucketRow) {
                var objectSelectionIndex = 0;
                //this.objectName is given as input to the render function
                var objName = this.objectName;
                this.highlightSelectedRow('#catalog-get-buckets-table', currentBucketRow);

                var that = this;
                var bucketName = that.getSelectedBucketName();
                var filterKind = this.kind;

                //for workflows, we don't want subkind filters (ie we want to be able to import workflow/pca and workflow/standard)
                if (this.kind.toLowerCase().indexOf('workflow') == 0) {
                    filterKind = "workflow";
                }
                if (this.filterKind) {
                    filterKind = this.filterKind;
                }
                var objectsModel = new CatalogObjectCollection({
                    bucketname: bucketName,
                    kind: filterKind,
                    objectName: this.getPreferenceObjectName(),
                    contentType: this.filterContentType,
                    callback: function(catalogObjects) {
                        //Loop over catalog objects and get the right selection index based on the input objectName
                        for (var k = 0; k < catalogObjects.length; k++) {
                            if (catalogObjects[k].name == objName) {
                                objectSelectionIndex = k;
                            }
                        }
                        that.$('#catalog-get-objects-table').empty();
                        if (catalogObjects.length === 0)
                            $('#catalog-get-import-button').prop('disabled', true);
                        else {
                            $('#catalog-get-import-button').prop('disabled', false);
                            _.each(
                                catalogObjects,
                                function(obj) {
                                    var ObjectList = _.template(catalogObject);
                                    that.$('#catalog-get-objects-table').append(ObjectList({
                                        catalogObject: obj
                                    }));
                                });
                        }
                        setTimeout(function() {
                            if (shouldScrollToTheSelectedBucket) {
                                that.getScrollToBucket();
                            }
                        }, 500)
                    }
                });
                setTimeout(function() {
                    objectsModel.fetch({
                        async: false
                    });
                    // default objectSelectionIndex is always 0 unless an input object is given to the render function
                    that.internalSelectObject(this.$('#catalog-get-objects-table tr')[objectSelectionIndex], true);
                }, 10)
            }
        },
        disableActionButtons: function (enableGetAsNew, enableAppend){
        	 $('#catalog-get-as-new-button').prop('disabled', enableGetAsNew);
        	 $('#catalog-get-append-button').prop('disabled', enableAppend);       
        },

        internalSelectObject: function(currentObjectRow, shouldScrollToTheSelectedObject) {
            this.$('#catalog-get-revisions-table').empty();
            if (currentObjectRow) {
                var currentWorkflowName = $(currentObjectRow).data("objectname");
                this.highlightSelectedRow('#catalog-get-objects-table', currentObjectRow);
                var that = this;

                var bucketName = that.getSelectedBucketName();
                var revisionsModel = new CatalogObjectRevisionCollection({
                    bucketname: bucketName,
                    name: currentWorkflowName,
                    callback: function(revisions) {
                        var latestRevision = JSON.parse(JSON.stringify(revisions[0])); //Copy of the fist revision: the latest one
                        latestRevision.links[1].href = 'buckets/' + latestRevision.bucket_name + '/resources/' + latestRevision.name;
                        var latestRevisionProjectName = latestRevision.project_name;
                        var latestRevisionTags = latestRevision.tags;
                        var RevisionList = _.template(catalogRevision);
                        $('#catalog-get-revisions-table').append(RevisionList({
                            revision: latestRevision,
                            projectname: latestRevisionProjectName,
                            tags: latestRevisionTags,
                            isLatest: true
                        }));
                        _.each(
                            revisions,
                            function(revision) {
                                var projectName = revision.project_name;
                                var tags = revision.tags;
                                var RevisionList = _.template(catalogRevision);
                                $('#catalog-get-revisions-table').append(RevisionList({
                                    revision: revision,
                                    projectname: projectName,
                                    tags: tags,
                                    isLatest: false
                                }));
                            }
                        );
                        that.internalSelectRevision(that.$('#catalog-get-revisions-table tr')[0])
                        if (shouldScrollToTheSelectedObject) {
                            that.getScrollToObject();
                        }
                    }
                });
                revisionsModel.fetch();
            } else {
                $("#catalog-get-select-button").prop('disabled', true);
            }
        },
        internalSelectRevision: function (currentRevisionRow) {
            var studioApp = require('StudioApp');
            this.$('#catalog-get-description-container').empty();
            
            if (currentRevisionRow){
                $("#catalog-get-select-button").prop('disabled', false);
                var splitRawUrl = $(currentRevisionRow).data("rawurl").split('/');

                //when you select an object revision from the Import modal, its objectName is already encoded.
                var objectName = decodeURIComponent(splitRawUrl[3]);
                var bucketName = splitRawUrl[1];
                var revisionId;
                if (splitRawUrl.length > 4) {
                    revisionId = splitRawUrl[5];
                }
	        	var rawurl = window.location.origin + config.prefixURL;
	        	if (revisionId) {
	        	    rawurl += '/catalog/buckets/' + bucketName + '/resources/' + objectName + '/revisions/' + revisionId +'/raw';
	        	} else {
	        	    rawurl += '/catalog/buckets/' + bucketName + '/resources/' + objectName + '/raw';
	        	}

	        	var name = $(currentRevisionRow).data("name");
	        	var commitMessage = $(currentRevisionRow).data("commitmessage");
        		var projectName = $(currentRevisionRow).data("projectname");
        		var tags = $(currentRevisionRow).data("tags");
        		var username = $(currentRevisionRow).data("username");

	            this.highlightSelectedRow('#catalog-get-revisions-table', currentRevisionRow);
        		
				var RevisionDescription = _.template(catalogRevisionDescription);
				$('#catalog-get-description-container').append(RevisionDescription({
					rawurl: rawurl,
					name: name,
					commitmessage: commitMessage,
					username: username,
					projectname: projectName,
					tags:tags,
					kindLabel: this.kindLabel
					}));

	            this.disableActionButtons(false, !studioApp.isWorkflowOpen());
            }
        },
        highlightSelectedRow: function(tableId, row){
        	var selectedClassName = 'catalog-selected-row';
        	var selected = $(tableId + " ." + selectedClassName);
        	if (selected[0]) {
        		$(selected[0]).removeClass(selectedClassName);
        	}
        	$(row).addClass(selectedClassName);
        },
        getSelectedBucketName: function(){
        	return this.getSelectedRowId("#catalog-get-buckets-table .catalog-selected-row", "bucketname");
        },
        getSelectedObjectName: function(){
        	return this.getSelectedRowId("#catalog-get-objects-table .catalog-selected-row", "objectname");
        },
        getSelectedRowId: function(tableSelector, dataName){
        	return ($(($(tableSelector))[0])).data(dataName);
        },
        selectBucket: function(e){
        	var row = $(e.currentTarget);
        	localStorage.setItem("selectBucket", row[0].getAttribute("data-bucketname"));
            this.internalSelectBucket(row, false);
        },
        selectObject: function(e){
        	var row = $(e.currentTarget);
            this.internalSelectObject(row, false);
        },
        copyClipBoard: function(){
            var inputCopy = $("#direct-object-url-input");
            inputCopy.select();
            document.execCommand("copy");
        },
        getPreferenceObjectName: function(){
            if (this.objectNameFilter) {
                return this.objectNameFilter;
            } else {
                return this.$('#get-object-by-name input').val();
            }
        },
        selectRevision: function(e){
        	var row = $(e.currentTarget);
            this.internalSelectRevision(row);
        },
        setInputToImportId: function(inputToImportId) {
            //setting the text area where we will import the object
            this.inputToImportId = inputToImportId;
        },
        importCatalogObject: function(){
            var headers = { 'sessionID': localStorage['pa.session'] };
            var that = this;
            var request = $.ajax({
                url: $("#catalog-get-revision-description").data("selectedrawurl"),
                type: 'GET',
                headers: headers,
                dataType: 'text' //without this option, it will execute the response if it's JS code
            }).success(function (response) {
                var inputToImport = document.getElementById(that.inputToImportId);
                var isUrlImport = that.inputToImportId.indexOf('_Url') > -1;
                if (isUrlImport) //if input id contains 'Url', we only import the URL of the selected catalog object
                    // if catalog host is the same as the studio, make catalog object url relative with ${PA_CATALOG_REST_URL}.
                    inputToImport.value = $("#catalog-get-revision-description").data("selectedrawurl").replace(window.location.origin + '/catalog/','${PA_CATALOG_REST_URL}/');
                else //Otherwise, we import the content of the catalog object
                    inputToImport.value = response;
                $('#catalog-get-close-button').click();
                StudioClient.alert('Import successful', 'The ' + that.kindLabel + ' has been successfully imported from the Catalog', 'success');
                if (that.kind.toLowerCase().indexOf('script') == 0) {
                    //saving script name and bucket for next commits
                    inputToImport.dataset.scriptName = that.getSelectedObjectName();
                    inputToImport.dataset.bucketName = that.getSelectedBucketName();
                    try {
                        //if it's a script, we set the language depending on the file extension
                        var contentDispositionHeader = request.getResponseHeader('content-disposition');
                        var fileName = contentDispositionHeader.split('filename="')[1].slice(0, -1);
                        var indexExt = fileName.lastIndexOf('.');
                        var language  = '';
                        if (indexExt > -1) {
                            var extension = fileName.substring(indexExt+1, fileName.length);
                            language = config.extensions_to_languages[extension.toLowerCase()] || '';
                        }
                        var languageElementId;
                        if (isUrlImport)
                            languageElementId = that.inputToImportId.replace('_Url', '_Language');
                        else
                            languageElementId = that.inputToImportId.replace('_Code', '_Language');
                        var languageElement = document.getElementById(languageElementId);
                        languageElement.value = language;
                    } catch (e) {
                        console.error('Error while setting language of the imported script: '+e);
                    }
                }
                //trigger input keyup event for model update
                inputToImport.dispatchEvent(new Event('keyup'));
            }).error(function (response) {
                StudioClient.alert('Error', 'Error importing the '+ that.kindLabel +' from the Catalog', 'error');
                console.error('Error importing the '+ that.kindLabel +' from the Catalog : '+JSON.stringify(response));
            });
        },
        showAllChanged : function(kind) {
            var filterKind = undefined;
            var filterContentType = undefined;
            var bucketNameFilter = undefined;
            if (!$('#get-show-all-checkbox input:checkbox').is(':checked')) {
                filterKind = kind;
                //for workflows, we don't want subkind filters (ie we want to be able to import workflow/pca and workflow/standard)
                if (kind.toLowerCase().indexOf('workflow') == 0) {
                    filterKind = "workflow";
                }
                if (this.filterKind) {
                    filterKind = this.filterKind;
                }
                if (this.filterContentType) {
                    filterContentType = this.filterContentType;
                }
                if (this.bucketNameFilter) {
                    bucketNameFilter = this.bucketNameFilter;
                }
            }
            var studioApp = require('StudioApp');
            studioApp.models.catalogBuckets.setKind(filterKind);
            studioApp.models.catalogBuckets.setContentType(filterContentType);
            studioApp.models.catalogBuckets.setBucketName(bucketNameFilter);
            studioApp.models.catalogBuckets.set(filterContentType);
            studioApp.models.catalogBuckets.fetch({reset: true});
        },
        filterByObjectsByName : function (event){
            event.preventDefault();
            const objectName = $('#get-object-by-name input').val();
            this.objectName = objectName;
            var studioApp = require('StudioApp');
            studioApp.models.catalogBuckets.setObjectName(objectName);
            studioApp.models.catalogBuckets.fetch({reset: true});
        },
        updateBuckets: function() {
            const that = this;
            this.$('#catalog-get-buckets-table').empty();
            var BucketList = _.template(catalogList);
            const countNotEmptyBuckets = this.buckets.models.filter(function(bucket) {
                return bucket.get('objectCount') > 0
            }).length;
            if (!countNotEmptyBuckets) {
                $("#get-catalog-view table").hide();
                if ($("#get-catalog-view p").length) {
                    const obj = $("#get-catalog-view p").text("No results for \"" + that.getPreferenceObjectName() + "\".\n Check your spelling or use more general terms.");
                    obj.html(obj.html().replace(/\n/g, '<br/>'));
                }
            } else {
                $("#get-catalog-view table").show();
                $("#get-catalog-view p").text('');
                _(this.buckets.models).each(function(bucket) {
                    var bucketName = bucket.get("name");
                    if (bucket.get('objectCount')) {
                        this.$('#catalog-get-buckets-table').append(BucketList({
                            bucket: bucket,
                            bucketname: bucketName
                        }));
                    }
                }, this);
                //
                if (that.$('#catalog-get-buckets-table tr').length) {
                    // Select the bucket given as an input to the render function
                    // else, select the previous bucket from the local storage if it isn't the first time
                    // otherwise, select the first bucket on the list
                    var selectedBucketName = this.bucketName ? this.bucketName : localStorage.selectBucket;
                    if (selectedBucketName) {
                        const indexOfSelectedBucket = (new Array(that.$('#catalog-get-buckets-table tr').length)).findIndex(function(elem, index) {
                            return that.$('#catalog-get-buckets-table tr')[index].getAttribute("data-bucketname") == selectedBucketName;
                        })
                        this.internalSelectBucket(this.$('#catalog-get-buckets-table tr')[indexOfSelectedBucket > 0 ? indexOfSelectedBucket : 0], true);
                    } else {
                        localStorage.setItem("selectBucket", that.$('#catalog-get-buckets-table tr')[0].getAttribute("data-bucketname"));
                        this.internalSelectBucket(this.$('#catalog-get-buckets-table tr')[0], true);
                    }
                }
            }
        },
        getScrollToBucket: function() {
            if ($("#catalog-get-modal").css("display") !== "none") {
                var scrollToVal = $('#catalog-get-modal .catalog-selected-row').offset().top - $('#catalog-get-buckets-table').parent().offset().top + $('#catalog-get-buckets-table').parent().scrollTop()
                $('#catalog-get-buckets-table').parent().scrollTop(scrollToVal);
            }
        },
        getScrollToObject: function() {
            if($("#catalog-get-modal").css("display") !== "none"){
                var scrollToVal = $('#catalog-get-objects-table .catalog-selected-row').offset().top - $('#catalog-get-objects-table').parent().offset().top + $('#catalog-get-objects-table').parent().scrollTop();
                $('#catalog-get-objects-table').parent().scrollTop(scrollToVal);
            }
        },
        render: function (bucket, object) {
            this.bucketName = bucket;
            this.objectName = object;
            this.$el.html(this.template());
            var bucketKind = this.kind;
            //for workflows, we don't want subkind filters (ie we want to be able to import workflow/pca and workflow/standard)
            if (this.kind.toLowerCase().indexOf('workflow') == 0) {
                bucketKind = "workflow";
            } else if (this.kind.toLowerCase() === 'all') {
                bucketKind = null;
            }
            if (this.filterKind) {
                bucketKind = this.filterKind;
            }
            this.buckets.setKind(bucketKind);
            this.buckets.setContentType(this.filterContentType);
            this.buckets.setBucketName(this.bucketNameFilter);
            this.buckets.setObjectName(this.getPreferenceObjectName());
            this.buckets.fetch({reset: true, async: false});
            //setting kind in catalogBrowser (catalog-get.html) because it can't be
            //passed as parameter (on page load, we don't know the kind yet)
            if (this.kind.toLowerCase() === 'all') {
                this.$('#catalog-objects-legend').text('Catalog Objects');
            } else {
                this.$('#catalog-objects-legend').text(this.kindLabel+'s and Projects');
            }
            return this;
        },
    })

})
