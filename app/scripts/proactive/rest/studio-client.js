define(
    [
        'jquery',
        'proactive/config',
        'pnotify',
        'pnotify.buttons'
    ],

    function($, config, PNotify) {

        "use strict";

        PNotify.prototype.options.styling = "bootstrap3";

        var cachedScripts;
        return {

            alert: function(caption, message, type) {
                var text_escape = message.indexOf("<html>") == -1 ? true : false;

                new PNotify({
                    title: caption,
                    text: message,
                    type: type,
                    text_escape: text_escape,
                    buttons: {
                        closer: true,
                        sticker: false
                    },
                    addclass: 'translucent', // defined in studio.css
                    width: '20%'
                });
            },

/*
 * Need to send a application/multipart-form, need to use the sshKey like this K must be a capital letter.
 *
 * examples from scheduler/portal/login:
 *
 * First login using simply the credentials:
 * ```
 * -----------------------------11455341699611662118707578
 * Content-Disposition: form-data; name="credential"; filename="admin_cred.txt"
 * Content-Type: text/plain
 *
 * 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
 * -----------------------------11455341699611662118707578--
 * ```
 *
 * Second login using username and password, without SSH key.
 *
 * ```
 * -----------------------------106259393478037601194543269
 * Content-Disposition: form-data; name="username"
 *
 * admin
 * -----------------------------106259393478037601194543269
 * Content-Disposition: form-data; name="password"
 *
 * asdfasdf
 * -----------------------------106259393478037601194543269
 * Content-Disposition: form-data; name="sshKey"; filename="admin_cred.txt"
 * Content-Type: text/plain
 *
 * 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
 * -----------------------------106259393478037601194543269--
 * ```
 *
*/
            login: function(creds, onSuccess) {
                var that = this;
                $.ajax({
                    url: config.restApiUrl + "/login",
                    data: creds,
                    cache: false,
                    contentType: false,
                    processData: false,
                    method: 'POST',
                    type: 'POST',
                    success: function(data) {
                        // ProActive Studio login request return invalid json with status code 200
                        console.log("Should not be there", data)
                    },
                    error: function(data) {
                        // even id successful we are here
                        if (data.status == 200) {
                            localStorage['pa.session'] = data.responseText;

                            $.ajax({
                                async: false,
                                type: "GET",
                                url: config.restApiUrl.replace("/studio","") + '/common/permissions/portals/studio',
                                beforeSend: function(xhr) {
                                    xhr.setRequestHeader('sessionid', localStorage['pa.session'],
                                                        'Content-Type', 'application/json')
                                },
                                success: function(response) {
                                    if(response){
                                        that.alert("Connected", "Successfully connected user", 'success');
                                        return onSuccess();
                                    } else {
                                        document.getElementById("permission-error").style.display = "block";
                                        document.getElementById("authentication-error").style.display = "none";
                                    }

                                },
                                error: function(data) {
                                    console.error("Unknown User Permission", data);
                                }
                            });
                        } else {
                            var reason = data.responseText.length > 0 ? data.responseText : "";
                            try {
                                var json = JSON.parse(reason);
                                if (json.errorMessage) {
                                    reason = json.errorMessage;
                                }
                            } catch (e) {}

                            if (data.status == 404) {
                                if (data.responseText.indexOf("login.LoginException") < 0) {
                                    reason = "The studio rest server is not available at the following url: " + config.restApiUrl;
                                }

                            }

                            document.getElementById("authentication-error").innerHTML = "<strong>Unable to login.</strong>  " + reason;
                            document.getElementById("authentication-error").style.display = "block";
                            document.getElementById("permission-error").style.display = "none";
                            //that.alert("Cannot connect to ProActive Studio", reason, 'error');
                            console.log("Error", data)
                        }
                    }
                });
            },

            logout: function() {
                var that = this;
                $.ajax({
                    type: "PUT",
                    url: config.restApiUrl + "/logout",
                    beforeSend: function(xhr) {
                        xhr.setRequestHeader('sessionid', localStorage['pa.session'])
                    },
                    success: function(data) {
                        console.log("Logged out")
                    },
                    error: function(data) {
                        console.log("Failed to logout", data)
                    }
                });
                localStorage.removeItem("pa.session");
            },

            /* check if session is opened from here or from another tab (scheduler/rm portals) */
            isSessionPresent: function() {
                 return localStorage['pa.session'] !== null && localStorage['pa.session'] !== undefined
            },

            getIsConnectedUrl: function() {
                return config.restApiUrl + "/connected"
            },

            isConnected: function(success, fail) {
                var that = this;
                if (localStorage['pa.session']) {
                    $.ajax({
                        async: false,
                        type: "GET",
                        url:  config.restApiUrl.replace("/studio","") + '/common/permissions/portals/studio',
                        beforeSend: function(xhr) {
                            xhr.setRequestHeader('sessionid', localStorage['pa.session'],
                                                'Content-Type', 'application/json')
                        },
                        success: function(response) {
                            if(response){
                                $.ajax({
                                    type: "GET",
                                    url: config.restApiUrl + "/connected",
                                    beforeSend: function(xhr) {
                                        xhr.setRequestHeader('sessionid', localStorage['pa.session'])
                                    },
                                    success: function(data) {
                                        if (data) {
                                            success()
                                        } else {
                                            localStorage.removeItem('pa.session');
                                            fail()
                                        }
                                    },
                                    error: function(data) {
                                        console.log("Not connected to the studio", data)
                                        localStorage.removeItem('pa.session')
                                        fail()
                                    }
                                });
                            } else {
                                document.getElementById("permission-error").style.display = "block";
                                document.getElementById("authentication-error").style.display = "none";
                                fail();
                            }
                             $("#connection-error").hide();
                        },
                        error: function(response) {
                            console.error("Unknown User Permission", response);
                             $("#connection-error").show();
                        }
                    });
                } else {
                    fail();
                }
            },

            //customize client side, set localStorage['pa.login'] with server username for current session
            setCurrentUser : function () {
                $.ajax({
                    type: 'GET',
                    url: config.restApiUrl + "/currentuserdata",
                    beforeSend: function(xhr) {
                        xhr.setRequestHeader('sessionid', localStorage['pa.session']);
                    },
                    async: false,
                    success: function(data) {
                        var username = data["userName"];
                        var domain = data["domain"];
                        if (domain) {
                            username = domain + "\\" + username;
                        }
                        localStorage['pa.login'] = username;
                    },
                    error: function(data) {
                            console.log("Problems to retrieve current user data" + data.responseText)
                    }
                });
            },

            getDomains : function () {
                var domains=[];
                $.ajax({
                    type: 'GET',
                    url: config.restApiUrl + "/domains",
                    async: false,
                    success: function(data) {
                        if (data.length > 0 && !data.includes("")) {
                            domains.push("");
                        }
                        for(var i = 0; i < data.length ; i++){
                            domains.push(data[i]);
                        }
                    },
                    error: function(data) {
                            console.log("Problems to retrieve domains" + data.responseText)
                    }
                });
                return domains;
            },

            getPortalsAuthorizations : function () {
                var result = null;
                $.ajax({
                    type: 'GET',
                    url: config.commonRestApiUrl + "/permissions/portals?portals=catalog-portal&portals=workflow-execution&portals=service-automation&portals=job-analytics&portals=job-gantt&portals=node-gantt&&portals=job-planner-calendar-def&portals=job-planner-calendar-def-workflows&portals=job-planner-execution-planning&portals=job-planner-gantt-chart&portals=notification-portal&portals=rm&portals=scheduler",
                    dataType: "json",
                    beforeSend: function(xhr) {
                        xhr.setRequestHeader('sessionid', localStorage['pa.session']);
                    },
                    async: false,
                    success: function(data) {
                        result = data;
                    },
                    error: function(data) {
                        console.log("Invalid response returned when retrieving portals authorization", data)
                        fail()
                    }
                });
                return result;
            },

            uploadBinaryFile: function(data, success, error) {
                var that = this;

                $.ajax({
                    url: config.restApiUrl + '/classes',
                    data: data,
                    cache: false,
                    contentType: false,
                    processData: false,
                    type: 'POST',
                    beforeSend: function(xhr) {
                        xhr.setRequestHeader('sessionid', localStorage['pa.session'])
                    },
                    success: function(data) {
                        console.log("Should not be there", data)
                        error();
                    },
                    error: function(data) {
                        if (data.status == 200) {
                            console.log("Success", data);
                            that.alert("File uploaded", "File successfully uploaded", 'success');
                            success(data.responseText);
                        } else {
                            console.log("Error", data);
                            var reason = "Unknown reason";
                            try {
                                var err = JSON.parse(data.responseText);
                                if (err.errorMessage) {
                                    reason = err.errorMessage;
                                }
                            } catch (e) {}

                            that.alert("Cannot upload a file", reason, 'error');
                            error();
                        }
                    }
                });
            },

            getClassesSynchronously: function() {
                if (!localStorage['pa.session']) return;
                var that = this;

                console.log("Getting classes list")
                var classes = undefined;
                $.ajax({
                    type: "GET",
                    url: config.restApiUrl + "/classes",
                    async: false,
                    beforeSend: function(xhr) {
                        xhr.setRequestHeader('sessionid', localStorage['pa.session'])
                    },
                    success: function(data) {
                        classes = data;
                    },
                    error: function(data) {
                        console.log("Cannot retrieve classes", data)
                        that.alert("Cannot retrieve classes", "Please refresh the page!", 'error');
                    }
                });
                return classes;
            },

            submit: function(jobXml) {
                if (!localStorage['pa.session']) return;

                var that = this;

                that.send_multipart_request(
                    config.restApiUrl + "/submit?submission.mode=studio",
                    jobXml.replace(/(href|src|value)="([^"]*)"/g, function(match, p1, p2) {
                        //remove the prefix url, in order to make the wf more generic
                        var newUrl = p2;
                        if (p2.startsWith('/') && p2.startsWith(config.prefixURL)) {
                            const len = config.prefixURL.length;
                            newUrl = p2.substring(len);
                        }
                        return p1 + '="' + newUrl + '"';
                    }),
                    {
                        "sessionid": localStorage['pa.session']
                    },
                    function(result) {
                        that.pausecomp(2000);
                        if (result.errorMessage) {
                            that.alert("Cannot submit the job", result.errorMessage, 'error');
                        } else if (result.id) {
                            that.alert(
                                "Job submitted",
                                "<html>" +
                                    "<label style='font-size: 16px;'>Your Workflow has been submitted successfully, Job Id: " + encodeURIComponent(result.id) + "</label>" +
                                    "</br>" +
                                    "<a href='" + encodeURI(config.prefixURL + "/automation-dashboard/#/workflow-execution") + "' target='_blank'>Open Job in Workflow Execution Portal</a></br>" +
                                    "<a href='javascript:void(0);' onclick=\"window.open('/automation-dashboard/#/job-info?jobid=" + encodeURIComponent(result.id) + "&tab=0', 'job-info-" + encodeURIComponent(result.id) + "', 'toolbar=no,menubar=no,scrollbars=yes,resizable=yes,location=no,directories=no,status=no')\" target='_blank'>Open Job Details in a New Popup Window</a></br>" +
                                    "<a href='" + encodeURI(config.prefixURL + "/scheduler/") + "' target='_blank'>Open Job in Scheduler Portal</a>" +
                                "</html>",
                                'success'
                            );

                        } else {
                            that.alert("Job submission", request.responseText, 'error');
                        }
                    },
                    true
                );
            },

            validateWithPopup: function(jobXml, jobModel, automaticValidation, disableCheckCredential) {
                if (!localStorage['pa.session']) return false;

                if (automaticValidation) {
                    if ((jobModel.getTasksCount() == 0)) {
                        return false;
                    }
                }

                var that = this;
                // not pass sessionId to disable checking the validity of PA:CREDENTIALS variables default value
                var headers = disableCheckCredential ? {} : {"sessionid": localStorage['pa.session']};

                return Boolean([that.send_multipart_request(config.restApiUrl + "/validate", jobXml, headers, function(result) {

                    if (that.lastResult) {

                        // avoiding similar messages in the log history
                        if (that.lastResult.errorMessage == result.errorMessage) {
                            // same error message
                            return false;
                        }
                        if (result.valid && that.lastResult.valid == result.valid) {
                            // valid
                            return true;
                        }
                    }

                    if (!result.valid) {
                        that.alert("Invalid workflow", result.errorMessage, 'error');
                        if (result.taskName != null) {
                            var taskModel = jobModel.getTaskByName(result.taskName);
                            if (taskModel) taskModel.trigger("invalid")
                        }
                        return false;
                    } else {
                        that.alert("Workflow is valid", "It can be executed now", 'success');
                        return true;
                    }
                    that.lastResult = result;
                }, true)]);
            },
            validate: function(jobXml, jobModel, checkCredential) {
                if (!localStorage['pa.session']) return;

                var that = this;
                // only pass sessionId when want to check the validity of PA:CREDENTIALS variables
                var headers = checkCredential ? {"sessionid": localStorage['pa.session']} : {};
                return that.send_multipart_request(config.restApiUrl + "/validate", jobXml, headers, null, false);
            },
            resetLastValidationResult: function() {
                this.lastResult = undefined;
            },
            send_multipart_request: function(url, content, headers, callback, async) {

                var that = this;

                var request = new XMLHttpRequest();
                var multipart = "";

                request.open("POST", url, async);

                var boundary = Math.random().toString().substr(2);

                request.setRequestHeader("content-type",
                    "multipart/form-data; charset=utf-8; boundary=" + boundary);

                for (var key in headers) {
                    if (headers.hasOwnProperty(key)) {
                        request.setRequestHeader(key, headers[key]);
                    }
                }

                multipart += "--" + boundary +
                    "\r\nContent-Disposition: form-data; name=job.xml" +
                    "\r\nContent-type: application/xml" +
                    "\r\n\r\n" + content + "\r\n";

                multipart += "--" + boundary + "--\r\n";

                if (async) {
                    request.onreadystatechange = function() {
                        if (request.readyState == 4) {
                            try {
                                var result = JSON.parse(request.responseText)
                            } catch (err) {
                                console.log("Cannot parse json response", err)
                                that.alert(request.responseText, 'error');
                                return;
                            }
                            callback(result);
                        }
                    }
                }

                request.send(multipart);

                if (!async) {
                    try {
                        return JSON.parse(request.responseText)
                    } catch (err) {
                        console.log("Cannot parse json response", err)
                        that.alert(request.responseText, 'error');
                        return;
                    }
                }
            },

            pausecomp: function(millis) {
                var date = new Date();
                var curDate = null;
                do {
                    curDate = new Date();
                }
                while (curDate - date < millis);
            },

            // saved the scheduler properties in sessionStorage
            // Note, the properties are only reloaded from the server when a new page session is initiated. (i.e., open a new tab, or re-open a closed the browser)
            // ref: https://developer.mozilla.org/en-US/docs/Web/API/Window/sessionStorage
            getSchedulerProperties: function(taskModel, setGlobalPropertiesIfNeeded) {
                if(sessionStorage['pa.scheduler.property']) {
                    console.debug("Using stored scheduler properties", sessionStorage['pa.scheduler.property']);
                    setGlobalPropertiesIfNeeded(taskModel);
                } else {
                    $.ajax({
                        type: "GET",
                        url: config.schedulerRestApiUrl + "/properties",
                        beforeSend: function(xhr) {
                            xhr.setRequestHeader('sessionid', localStorage['pa.session'])
                        },
                        success: function(data) {
                            console.debug("Request scheduler properties", data);
                            var map = JSON.parse(JSON.stringify(data));
                            var relatedProperties = new Map();
                            relatedProperties.set("runasme", map["pa.scheduler.task.runasme"])
                            relatedProperties.set("fork", map["pa.scheduler.task.fork"])
                            sessionStorage['pa.scheduler.property'] = JSON.stringify(Array.from(relatedProperties));
                            setGlobalPropertiesIfNeeded(taskModel);
                        },
                        error: function(data) {
                            console.log("Failed to get scheduler properties", data)
                        }
                    });
                }
            },
        }

    })
