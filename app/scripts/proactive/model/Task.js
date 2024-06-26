define(
    [
    'backbone',
    'underscore',
    'proactive/model/SchemaModel',
    'proactive/model/ScriptExecutable',
    'proactive/model/NativeExecutable',
    'proactive/model/JavaExecutable',
    'proactive/model/ForkEnvironment',
    'proactive/model/script/Script',
    'proactive/model/script/SelectionScript',
    'proactive/model/script/ForkEnvironmentScript',
    'proactive/model/script/PreScript',
    'proactive/model/script/PostScript',
    'proactive/model/script/FlowScript',
    'proactive/model/script/CleanScript',
    'proactive/view/utils/undo',
    'text!proactive/templates/submodel-radio-form-template.html',
    'text!proactive/templates/selection-script-host-template.html',
    'text!proactive/templates/selection-script-os-template.html',
    'text!proactive/templates/selection-script-totalmem-template.html',
    'proactive/model/utils',
    'proactive/config',
    'proactive/rest/studio-client'
    ],

     // TODO REMOVE undoManager dependency - comes from view
     function (Backbone, _, SchemaModel, ScriptExecutable, NativeExecutable, JavaExecutable, ForkEnvironment, Script, SelectionScript, ForkEnvironmentScript,
            PreScript, PostScript, FlowScript, CleanScript,
            undoManager, radioFormTemplate, ssHostTemplate, ssOSTemplate, ssTotalMemTemplate, Utils, config, StudioClient) {

        "use strict";

        var Task = SchemaModel.extend({
            schema: {
                "Task Name": {
                    type: "Text",
                    fieldAttrs: {
                        'placeholder': '@attributes->name',
                        "data-tab": "Task General Parameters",
                        'data-tab-help': 'General Task Parameters (name, description, variables...)',
                        "data-help": 'Unique name of a task without spaces.'
                    }
                },
                "Description": {
                    type: "TextArea",
                    editorClass: "textareataskdescription",
                    fieldAttrs: {
                        'placeholder': ['description->#cdata-section', 'description->#text'],
                        "data-help": 'A small textual description of what task does.'
                    }
                },
                "Generic Info Documentation": {
                  type: "Link",
                  fieldAttrs: {
                    "id": "gidoc",
                    "data-help": "Link to Task Documentation. Set value in Generic Information named \"TASK.DOCUMENTATION\""
                  },
                  title: 'Documentation'
                },
                "Task Result Added to Job Result": {
                    type: "Checkbox",
                    fieldAttrs: {
                        'placeholder': '@attributes->preciousResult',
                        "data-help": 'Indicates if you want to save the result of this task in the job result.'
                    }
                },
                "Variables": {
                    type: 'List',
                    itemType: 'Object',
                    title: "Task Variables",
                    fieldAttrs: {
                        'placeholder': 'variables->variable',
                        "data-tab": "Task Variables",
                        'data-tab-help': 'Task Variables that will be available within task scope.'
                    },
                    itemToString: Utils.inlineNameValueInherited, itemTemplate: Utils.bigCrossTemplate,
                    subSchema: {
                    "Name": { validators: ['required'], fieldAttrs: {'placeholder': '@attributes->name', 'data-help': "Name of the variable. It must start with a letter and it can contain only alphanumeric and -, _ or . characters."}, title: 'Name', type: 'Text', editorClass: 'popup-input-text-field' },
                    "Value": { fieldAttrs: {'placeholder': '@attributes->value', 'data-help': "Value of the variable."}, title: 'Value', type: 'TextArea', editorClass: 'popup-input-text-field textareavalues', editorAttrs: {'rows': '1'} },
                    "Inherited": { fieldAttrs: {'placeholder': '@attributes->inherited', 'data-help':"When a task variable is inherited, its default value is used only when the variable does not exist already at the workflow level."}, type: 'Checkbox' },
                    "Model": { fieldAttrs: {'placeholder': '@attributes->model'}, title: '<br>Model or Data Type (PA:Integer, PA:Boolean, ...)<br>see <a target="_blank" href="' + config.docUrl +'/user/ProActiveUserGuide.html#_variable_model">documentation</a>.', type: 'TextArea', editorClass: 'popup-input-text-field textareavalues', editorAttrs: {'rows': '1'} },
                    "Description": { fieldAttrs: {'placeholder': '@attributes->description', 'data-help': "Html Description of the variable. It can contain html tags."}, type: 'TextArea', editorClass: 'popup-input-text-field textareavalues', editorAttrs: {'rows': '1'} },
                    "Group": { fieldAttrs: { 'placeholder': '@attributes->group', 'data-help': 'The variable can be assigned to a group. Variables of the same group will appear together in the workflow submission form.' }, type: 'Text', editorClass: 'popup-input-text-field'},
                    "Advanced": { fieldAttrs: { 'placeholder': '@attributes->advanced',  'data-help': 'An advanced variable is not shown by default in the submission form, but can be displayed if needed.' }, type: 'Checkbox', editorClass: 'popup-input-text-field textareavalues', editorAttrs: {'rows': '1'} },
                    "Hidden": { fieldAttrs: { 'placeholder': '@attributes->hidden', 'data-help': 'A hidden variable is never shown in the submission form, but the hidden status can be modified using a model SpEL expression. This can be used to produce dynamic forms.' }, type: 'Checkbox', editorClass: 'popup-input-text-field textareavalues', editorAttrs: {'rows': '1'} }
                    },
                    confirmDelete: 'You are about to remove a variable.'
                },
                "Generic Info": {
                    title: 'Task Generic Info',
                    type: 'List',
                    itemType: 'Object',
                    fieldAttrs: {
                        'placeholder': 'genericInformation->info',
                        "data-tab": "Task Generic Info",
                        "data-tab-help": 'Some extra information about your job often used to change the scheduling behavior for a job. E.g. NODE_ACCESS_TOKEN=rack1 will assign this task to a node with token \"rack1\".'
                    },
                    itemToString: Utils.inlineNameValue, itemTemplate: Utils.bigCrossTemplate,
                    subSchema: {
                        "Property Name": {
                            validators: ['required'],
                            editorClass: 'taskGenericInfo',
                            editorAttrs: {
                                'spellcheck' : 'false',
                                'autocorrect' : 'off',
                                'autocomplete' : 'off',
                                'autocapitalize' : 'off'
                            },
                            fieldAttrs: {'placeholder': '@attributes->name'},
                            title: '<br>Property Name.<br>see <a target="_blank" href="' + config.docUrl + '/user/ProActiveUserGuide.html#_generic_information">documentation</a><br>'
                        },
                        "Property Value": {
                            type: 'TextArea',
                            validators: ['required'],
                            fieldAttrs: {'placeholder': '@attributes->value'},
                            editorClass: 'textareavalues',
                            editorAttrs: {'rows': '1'}
                        }
                    },
                    confirmDelete: 'You are about to remove a property.'
                },
                "Input Files": {
                    type: 'List',
                    itemType: 'Object',
                    fieldAttrs: {
                        "data-tab": "Task Data Management",
                        'data-tab-help': 'Input and output files transferred before and after the task execution',
                        'placeholder': 'inputFiles->files',
                        "data-help": 'Files from your user or global spaces that will be transferred to computing nodes automatically.'
                    },
                    subSchema: {
                        "Excludes": {type: "Text", fieldAttrs: {'placeholder': '@attributes->excludes'}, editorClass: 'popup-input-text-field'},
                        "Includes": {type: "Text", fieldAttrs: {'placeholder': '@attributes->includes'}, editorClass: 'popup-input-text-field'},
                        "Access Mode": {
                            type: 'Select',
                            fieldAttrs: {'placeholder': '@attributes->accessMode'},
                            options: ["transferFromUserSpace", "transferFromGlobalSpace", "transferFromInputSpace", "transferFromOutputSpace","cacheFromUserSpace", "cacheFromGlobalSpace", "cacheFromInputSpace", "cacheFromOutputSpace", "none"]
                        }
                    },
                    itemTemplate: Utils.bigCrossTemplate,
                    confirmDelete: 'You are about to remove an input file.'
                },
                "Output Files": {
                    type: 'List',
                    itemType: 'Object',
                    fieldAttrs: {
                        'placeholder': 'outputFiles->files',
                        "data-help": 'Files produced by task that that will be transferred from computing nodes to your user or global spaces automatically.'
                    },
                    subSchema: {
                        "Excludes": {type: "Text", fieldAttrs: {'placeholder': '@attributes->excludes'}},
                        "Includes": {type: "Text", fieldAttrs: {'placeholder': '@attributes->includes'}},
                        "Access Mode": {
                            type: 'Select',
                            fieldAttrs: {'placeholder': '@attributes->accessMode'},
                            options: ["transferToUserSpace", "transferToGlobalSpace", "transferToOutputSpace", "none"]
                        }
                    },
                    itemTemplate: Utils.bigCrossTemplate,
                    confirmDelete: 'You are about to remove an output file.'
                },
                "Store Task Logs in a File": {
                    type: "Checkbox",
                    fieldAttrs: {
                        'placeholder': '@attributes->preciousLogs',
                        "data-help": 'Defines if all the task logs must be kept even if it produces a lot of output. Data spaces are required in this case.'
                    }
                },
                // extra parameters for the simple view
                "Host Name": {
                    type: "Text",
                    fieldAttrs: {
                        "data-help": 'A host name or a part of host name on which this task must be executed',
                        "simple-view": true
                    }
                },
                "Operating System": {
                    type: 'Select',
                    fieldAttrs: {
                        "data-help": 'An operating system name where this task must be executed.',
                        "simple-view": true
                    },
                    options: [
                              {val: "any", label: "Any"},
                              {val: "linux", label: "Linux"},
                              {val: "windows", label: "Windows"},
                              {val: "mac", label: "Mac"}
                              ]
                },
                "Required amount of memory (in mb)": {
                    type: "Text",
                    fieldAttrs: {"data-help": 'A host with this amount of memory.', "simple-view": true}
                },
                "Dedicated Host": {
                    type: "Checkbox",
                    fieldAttrs: {
                        "data-help": 'Run the task exclusively on host - no other tasks will be executed in parallel on the same host.',
                        "simple-view": true
                    }
                },
                "Number of Execution Attempts": {
                    type: "Text",
                    fieldAttrs: {
                        "data-tab": "Task Error Management Policy",
                        'data-tab-help': 'Task error management',
                        'placeholder': '@attributes->maxNumberOfExecution',
                        "data-help": 'Defines the maximum number of execution attempts of the task.<br> If 0, it will inherit  the maximum number of execution attempts of the job.'
                    }
                },
                "Maximum Execution Time (hh:mm:ss)": {
                    type: "Text",
                    fieldAttrs: {
                        'placeholder': '@attributes->walltime',
                        "data-help": 'Task execution timeout. Format is the following:<br/><br/>5 means 5 seconds<br/><br/>10:5 means 10 minutes 5 seconds<br/><br/>1:02:03 is 1 hour 2 minutes and 3 seconds.'
                    }
                },
                "On Task Error Policy": {
                    type: 'Select',
                    fieldAttrs: {
                        'placeholder': '@attributes->onTaskError',
                        "data-help": 'Overwrites the on task error policy set for the job.<br><br>The actions that are available at the Task level are:<br>&nbsp;&nbsp;- Defined at job level<br>&nbsp;&nbsp;- Level 0 - Default: Ignore Error and continue Job execution<br>&nbsp;&nbsp;- Level 1 - In-Error: Continue Job execution, but suspend error-dependent Tasks <br>&nbsp;&nbsp;- Level 2 - Pause: Continue running Tasks, and suspend all others <br>&nbsp;&nbsp;- Level 3 - Cancel: Running Tasks are aborted, and others not started.'
                    },
                    options: [
                              {val: "none", label: "Defined at job level"},
                              {val: "continueJobExecution", label: "Level 0 - Default: Ignore Error and continue Job execution"},
                              {val: "suspendTask", label: "Level 1 - In-Error: Continue Job execution, but suspend error-dependent Tasks"},
                              {val: "pauseJob", label: "Level 2 - Pause: Continue running Tasks, and suspend all others"},
                              {val: "cancelJob", label: "Level 3 - Cancel: Running Tasks are aborted, and others not started"}
                              ]
                },
                "If An Error Occurs Restart Task": {
                    type: 'Select',
                    fieldAttrs: {
                        'placeholder': '@attributes->restartTaskOnError',
                        "data-help": 'Defines whether tasks that have to be restarted will restart on an other computing node.'
                    },
                    options: ["anywhere", "elsewhere"]
                },
                "Delay Before Retry Task (hh:mm:ss)": {
                    type: "Text",
                    fieldAttrs: {
                        'placeholder': '@attributes->taskRetryDelay',
                        "data-help": 'Overwrites how long to wait before restart the task in error. <br/><br/>Format is the following:<br/><br/>5 means 5 seconds<br/><br/>10:5 means 10 minutes 5 seconds<br/><br/>1:02:03 is 1 hour 2 minutes and 3 seconds.'
                    }
                },
                // Type is a radio button which can select an active NestedModel
                // The options values match each one nested model defined in this schema
                // the placeholder defines which xml structure triggers one nested model or the other
                "Type": {
                    type: 'TaskTypeRadioEditor',
                    fieldAttrs: {
                        "data-help": '<b>Script Task</b>, a script written in Groovy, Ruby, Python and other languages supported by the JSR-223.<br/><b>Native Task</b>, an executable with eventual parameters to be executed.<br/><b>Java Task</b>, a task written in Java extending the Scheduler API.',
                        "data-tab": "Task Implementation",
                        'data-tab-help': 'Implementation of the task (script, executable or java class extending the Scheduler API)',
                        'placeholder': 'scriptExecutable|nativeExecutable|javaExecutable'
                    },
                    fieldClass: 'task-type',
                    options: [
                              {val: "ScriptExecutable", label: "Script"},
                              {val: "NativeExecutable", label: "Native"},
                              {val: "JavaExecutable", label: "Java"}
                              ]
                },
                "ScriptExecutable": {
                    type: 'NestedModel',
                    model: ScriptExecutable,
                    template: _.template("<% var selectedRadioType = 'Type'; %>" + radioFormTemplate),
                    fieldAttrs: {
                        'placeholder': 'scriptExecutable'
                    },
                    title: ""
                },
                "NativeExecutable": {
                    type: 'NestedModel',
                    model: NativeExecutable,
                    template: _.template("<% var selectedRadioType = 'Type'; %>" + radioFormTemplate),
                    fieldAttrs: {
                        'placeholder': 'nativeExecutable'
                    },
                    title: ""
                },
                "JavaExecutable": {
                    type: 'NestedModel',
                    model: JavaExecutable,
                    template: _.template("<% var selectedRadioType = 'Type'; %>" + radioFormTemplate),
                    fieldAttrs: {
                        'placeholder': 'javaExecutable'
                    },
                    title: ""
                },
                "Pre Script": {
                    type: 'NestedModel',
                    model: PreScript,
                    fieldAttrs: {
                        "data-tab": "Task Pre/Post/Clean scripts",
                        'data-tab-help': 'Scripts executed before and after the task',
                        'placeholder': 'pre',
                        "data-help": 'A script that is executed on the computing node before executing the task.'
                    }
                },
                "Post Script": {
                    type: 'NestedModel',
                    model: PostScript,
                    fieldAttrs: {
                        'placeholder': 'post',
                        "data-help": 'A script that is executed on the computing node after the task execution (if the task is finished correctly).'
                    }
                },
                "Clean Script": {
                    type: 'NestedModel',
                    model: CleanScript,
                    fieldAttrs: {
                        'placeholder': 'cleaning',
                        "data-help": 'A script that is executed on the computing node after the task execution even if the task failed.'
                    }
                },
                "Number of Nodes": {
                    type: 'Text',
                    fieldAttrs: {
                        "data-tab": "Task Multi-Node Execution",
                        'data-tab-help': 'Configuration of resources requirements',
                        'placeholder': 'parallel->@attributes->numberOfNodes',
                        "data-help": 'Usually a task require one computing node to be executed. Sometimes task can be a distributed program itself (e.g. MPI computations).<br/><br/>If the number of nodes is greater than one, the scheduler can optimize task allocation by running the task on a reserved node and passing the other available nodes as parameters.'
                    }
                },
                "Topology": {
                    type: 'Select',
                    fieldAttrs: {
                        'placeholder': 'parallel->topology',
                        "data-help": 'The topology of computing nodes in the network in terms of network latency.'
                    },
                    options: ["none", "arbitrary",
                              {val: "bestProximity", label: "best proximity"},
                              {val: "singleHost", label: "single host"},
                              {val: "singleHostExclusive", label: "single host exclusive"},
                              {val: "multipleHostsExclusive", label: "multiple host exclusive"},
                              {val: "differentHostsExclusive", label: "different host exclusive"}]
                },
                "Or Topology Threshold Proximity": {
                    type: "Number",
                    fieldAttrs: {
                        'placeholder': 'parallel->topology->thresholdProximity->@attributes->threshold',
                        "data-help": 'Hosts in the network with predefined max latency between all of them.'
                    }
                },
                "Node Selection": {
                    type: 'List',
                    itemType: 'NestedModel',
                    model: SelectionScript,
                    itemToString: function (selectionScript) {
                        if (selectionScript.Type)
                            return "<u style='cursor: pointer;'>Selection script ("+ selectionScript.Type +") </u>";
                        else
                            return "<u style='cursor: pointer;'>Selection script </u>";
                    },
                    itemTemplate: Utils.bigCrossTemplate,
                    fieldAttrs: {
                        "data-tab": "Task Node Selection",
                        'placeholder': 'selection',
                        "data-tab-help": 'A node selection provides an ability for the scheduler to execute tasks on particular ProActive nodes. E.g. you can specify that a task must be executed on a Unix/Linux system.'
                    },
                    title: "",
                    confirmDelete: 'You are about to remove a Selection script.'
                },
                "Fork": {
                    type: "Checkbox",
                    fieldAttrs: {
                        // The Fork Execution Environment begins the Fork Environment tab, 'data-tab',
                        // everything which comes after this tab is included in it, if no new 'data-tab'
                        // is defined.
                        "data-tab": "Task Fork Environment",
                        "data-tab-help": "Task Fork Environment is a new customisable JVM started to only run the task it belongs to. Also specify how to start this JVM, like in a Docker container for example.",
                        'placeholder': '@attributes->fork',
                        "data-help": 'Executes the task in a forked JVM. When it is false, all the other fork environment configurations are not taken into account.'
                    }
                },
                "Run as me": {
                    type: "Checkbox",
                    fieldAttrs: {
                        'placeholder': '@attributes->runAsMe',
                        "data-help": 'Executes the task under your system account, it also implies the task is executed in a forked JVM.'
                    }
                },
                // Add the Fork Execution Environment select before the Fork Environment model. Because
                // that is the only way to receive precise events. If something changes in the
                // Fork Environment the whole model will be copied in the changed event, therefore specific events
                // can't be distinguished. That is because Backbone js dos not support nested models (without
                // appropriate plugins/frameworks). In this case, nested models are used but no code which
                // handles them. That's why we arrived at this hybrid design.
                "Fork Execution Environment": {
                    type: "Select",
                    options: ["User Defined", "Docker", "Singularity", "Podman"],
                    fieldAttrs: {
                        "data-help":"The environment in which to execute this task. " +
                        "Example: Docker selected will execute this task inside a Docker container."
                    }
                },
                "Fork Environment": {
                    type: 'NestedModel',
                    model: ForkEnvironment,
                    fieldAttrs: {
                        "placeholder": "forkEnvironment"
                    },
                    title: ""
                },
                "Control Flow": {
                    type: 'Select',
                    options: ["none", "if", "replicate", "loop"],
                    fieldAttrs: {
                        "data-tab": "Task Control Flow",
                        "data-tab-help": 'Advanced control flow constructions, such as if, loop and replicate.'
                    },
                    title: ""
                },
                "Block": {
                    type: 'Select',
                    options: ["none", {val: "start", label: "start block"}, {val: "end", label: "end block"}],
                    fieldAttrs: {
                        "placeholder": "controlFlow->@attributes->block",
                        "data-help": "Task blocks are defined by pairs of start and end tags.<br/>The role of task blocks is to restrain the expressiveness of the system so that a workflow can be statically checked and validated."
                    }
                },
                "PositionTop": {
                    type: "Hidden",
                    fieldAttrs: {
                        "placeholder": "metadata->positionTop->#text"
                    }
                },
                 "PositionLeft": {
                     type: "Hidden",
                     fieldAttrs: {
                         "placeholder": "metadata->positionLeft->#text"
                     }
                 }
            },

            initialize: function () {
                if (!Task.counter) {
                    Task.counter = 0
                }

                this.schema = $.extend(true, {}, this.schema);
                // Generic Info
                this.set({
                  "Generic Info": new Array()
                });
                this.set({"Type": "ScriptExecutable"});
                this.set({"ScriptExecutable": new ScriptExecutable()});
                this.set({"Fork Environment": new ForkEnvironment()});
                this.set({"Fork": true});
                this.set({"Run as me": false});
                this.set({"Task Name": "Task" + (++Task.counter)});
                this.set({"Maximum Number of Execution Attempts": ""});
                this.set({"Precious Result": false});
                this.set({"On Task Error Policy": "none"});
                this.set({"If An Error Occurs Restart Task": "anywhere"});
                this.set({"Store Task Logs in a File": false});
                this.set({"Number of Nodes": 1});
                this.set({
                  "Generic Info Documentation": "{\"name\":\"Undefined\",\"url\":\"" + config.docUrl + "/user/ProActiveUserGuide.html#_generic_information\"}"
                });
                var that = this;
                this.schema.Variables.subSchema.Model.validators = [
                    function checkVariableValue(value, formValues, form) {
                        if (formValues.Model.length > 0) {
                            var StudioApp = require('StudioApp');
                            if (StudioApp.isWorkflowOpen()) {
                                that.updateVariable(formValues);
                                var validationData = StudioClient.validate(StudioApp.views.xmlView.generateXml(), StudioApp.models.jobModel, false);
                                if (!validationData.valid) {
                                    var err = {
                                        type: 'Validation',
                                        message: "<br><br>" + validationData.errorMessage
                                    };
                                    return err;
                                } else if (formValues.Model && formValues.Model.toUpperCase() === "PA:HIDDEN" && formValues.Value.trim().length > 0) {
                                    formValues.Value = validationData.updatedVariables[that.attributes["Task Name"] + ":" + formValues.Name];
                                    if (form) {
                                        form.setValue(formValues);
                                    }
                                    that.trigger("change:Variables", formValues);
                                } else {
                                    that.trigger("change:Variables", formValues);
                                }
                                delete that.attributes.BackupVariables;
                            }
                        }
                        if(undoManager.isHTML(formValues["Name"])){
                            var err = {
                                type: 'Validation',
                                message: "<br><br> HTML code is not allowed"
                              };
                              return err;
                        }
                    }
                ];
                this.schema["Generic Info"].subSchema["Property Value"].validators = [
                    function checkInputGenericINfo(value, formValues, form){
                        if(undoManager.isHTML(formValues["Property Name"])){
                            var err = {
                                type: 'Validation',
                                message: "<br><br> HTML code is not allowed"
                              };
                              return err;
                        }
                    }
                ]
                this.schema["Input Files"].subSchema["Access Mode"].validators = [
                    function checkInputFileData(value, formValues, form) {
                        if(undoManager.isHTML(formValues["Excludes"]) || undoManager.isHTML(formValues["Includes"])){
                            var err = {
                                type: 'Validation',
                                message: "<br><br> HTML code is not allowed"
                              };
                              return err;
                        }
                    }
                ];

                this.schema["Number of Execution Attempts"].validators = [
                    function checkNumberOfExecutionForTask(value, formValues, form){
                         if(!validVariableOrPositiveNumber(value)) {
                            var err = {
                                type: 'Validation',
                                message: "<br>The value should contain a variable or a positive number"
                                };
                            return err;
                        }
                   }
                ];

                this.schema["Number of Nodes"].validators = [
                    function checkNumberOfNodes(value, formValues, form){
                        if(!validVariableOrPositiveNumber(value)) {
                            var err = {
                                type: 'Validation',
                                message: "<br>The value should contain a variable or a positive number"
                                };
                            return err;
                        }
                   }
                ];

                this.schema["Delay Before Retry Task (hh:mm:ss)"].validators = [
                    function checkDelayBeforeRetryTask(value, formValues, form){
                        if (!validTimeFormat(value)) {
                            var err = {
                                type: 'Validation',
                                message: "<br>The value does not match <b>hh:mm:ss</b> format"
                                };
                            return err;
                        }
                   }
                ];

                this.schema["Maximum Execution Time (hh:mm:ss)"].validators = [
                    function checkMaximumExecutionTime(value, formValues, form){
                        if (!validTimeFormat(value)) {
                            var err = {
                                type: 'Validation',
                                message: "<br>The value does not match <b>hh:mm:ss</b> format"
                                };
                            return err;
                        }
                   }
                ];

                this.schema["Output Files"].subSchema["Access Mode"].validators = [
                    function checkInputFileData(value, formValues, form) {
                        if(undoManager.isHTML(formValues["Excludes"]) || undoManager.isHTML(formValues["Includes"])){
                            var err = {
                                type: 'Validation',
                                message: "<br><br> HTML code is not allowed"
                              };
                              return err;
                        }
                    }
                ];

                function validTimeFormat(value){
                    var hourMinSecondsRegexp = new RegExp("^((([0-9]|[1-9][0-9]+):?([0-5][0-9]):?([0-5][0-9]))$)");
                    var minSecondsRegexp = new RegExp("^((([0-9]|[1-9][0-9]+):?([0-9]|[0-5][0-9])$))");
                    var secondsRegexp = new RegExp("^([0-9]|[1-9][0-9]+)$");
                    if (!value || value.length === 0 || hourMinSecondsRegexp.test(value) || minSecondsRegexp.test(value) || secondsRegexp.test(value)) {
                        return true;
                    }
                    else {
                        return false;
                    }
                }

                function validVariableOrPositiveNumber(value){
                    var varRegexBrackets = new RegExp(".*\\$\\{([a-zA-Z]+)}+");
                    var varRegex = new RegExp(".*\\$[a-zA-Z]+");
                    var numberRegex = new RegExp("^[0-9][0-9]*$");
                    if (!value || value.length === 0 || varRegexBrackets.test(value) || varRegex.test(value) || numberRegex.test(value)) {
                        return true;
                    } else {
                        return false;
                    }
                }

                this.controlFlow = {};

                this.on("change", function(eventName, error) {
                  if (eventName) {
                    if (eventName._changing) {
                      // Check if Generic Info doc has been changed and generate new link if needed
                      if (eventName.changed.hasOwnProperty('Generic Info') && eventName.changed["Generic Info"]["Property Value"] != "") {
                        // retrieve GI from updated data
                        var genericInformation = eventName.changed["Generic Info"];
                        var hasDocumentation;

                        // Regenerate new documentation url
                        for (var i in genericInformation) {
                          if (genericInformation[i]["Property Name"].toLowerCase() === 'task.documentation') {
                            hasDocumentation = true;
                            var linkName = genericInformation[i]["Property Value"];
                            var documentationValue = genericInformation[i]["Property Value"];
                            break;
                          }
                        }

                        if (hasDocumentation) {
                          // Set New Value, needed for persistance
                          this.set({
                            "Generic Info Documentation": "{\"name\":\"" + linkName + "\",\"url\":\"" + documentationValue + "\"}"
                          });

                          // Needed to update UI
                          $('a[name="Generic Info Documentation"]').text(documentationValue);
                          if (documentationValue.indexOf('://') > 0) {
                            $('a[name="Generic Info Documentation"]').attr("href", documentationValue);
                          } else {
                            if (!documentationValue.startsWith("/")) {
                               documentationValue = "/" + documentationValue;
                            }
                            $('a[name="Generic Info Documentation"]').attr("href", config.docUrl + documentationValue);
                          }
                        } else {
                            $('a[name="Generic Info Documentation"]').text("Undefined");
                            $('a[name="Generic Info Documentation"]').attr("href", config.docUrl + "/user/ProActiveUserGuide.html#_generic_information\"");

                            this.set({
                              "Generic Info Documentation": "{\"name\":\"" + "Undefined" + "\",\"url\":\"" + config.docUrl + "/user/ProActiveUserGuide.html#_generic_information\"}"
                            });
                        }

                      } else if (eventName.changed.hasOwnProperty('Generic Info')) {
                           genericInformation = eventName.changed["Generic Info"];
                        if (genericInformation.length == 0) {
                          // Documentation has been deleted, make sure to update link
                          this.set({
                            "Generic Info Documentation": "{\"name\":\"Undefined\",\"url\":\"#\"}"
                          });

                          if ($('a[name="Generic Info Documentation"]')) {
                            $('a[name="Generic Info Documentation"]').text("Undefined");
                            $('a[name="Generic Info Documentation"]').attr("href", config.docUrl + "/user/ProActiveUserGuide.html#_generic_information\"");
                            undoManager.save();
                          }
                        }else{
                          console.log ("No task.documentation defined for this task");
                        }
                      }
                    }
                  } else {
                    undoManager.save();
                  }
                });
            },

            // documentation GI:  value will be displayed as link
            generateDocumentUrl: function(genericInformation) {
              var hasDocumentation;
              var linkName = "Undefined";
              var documentationValue = "Undefined";

              if (this.attributes.hasOwnProperty('Generic Info') && this.attributes["Generic Info"] != "") {
                for (var i in genericInformation) {
                  if (genericInformation[i]["Property Name"].toLowerCase() === 'task.documentation') {
                    hasDocumentation = true;
                    linkName = genericInformation[i]["Property Value"];
                    documentationValue = genericInformation[i]["Property Value"];
                  }
                }
              } else{
                hasDocumentation = false;
                linkName = "Undefined";
                documentationValue = config.docUrl + '/user/ProActiveUserGuide.html#_a_simple_example';
              }

              // Set Value
              this.set({
                "Generic Info Documentation": "{\"name\":\"" + linkName + "\",\"url\":\"" + this.generateUrl(documentationValue) + "\"}"
              });
            },

            generateUrl: function(data) {
              var url;
              if (data) {
                if (data.toLowerCase() === 'undefined') {
                  url = config.docUrl + '/user/ProActiveUserGuide.html#_a_simple_example';
                } else if (data.indexOf('://') > 0) {
                  url = data;
                } else {
                  if (!data.startsWith("/")) {
                     data = "/" + data;
                  }
                  url = config.docUrl + data;
                }
              }

              return url;
            },
            addDependency: function (task) {
                if (!this.dependencies) this.dependencies = [];

                var index = this.dependencies.indexOf(task);
                if (index == -1) {
                    this.dependencies.push(task)
                    this.trigger("change")
                }
            },
            updateVariable: function (variable) {
                if (!variable.hasOwnProperty('Value') || !variable.Value) {
                    variable.Value = "";
                }
                if (this.attributes.hasOwnProperty('Variables')) {
                    var variables;
                    // we save the original Variables attribute in BackupVariables, and use this afterwards
                    // This way, any modification will only be applied to the original Variables object
                    // This prevents piling up modifications in the variable list
                    if (this.attributes.hasOwnProperty('BackupVariables')) {
                      this.attributes.Variables = JSON.parse(JSON.stringify(this.attributes.BackupVariables));
                    } else {
                      this.attributes.BackupVariables = JSON.parse(JSON.stringify(this.attributes.Variables));
                    }
                    variables = this.attributes.Variables;
                    var index = -1
                    for (var i = 0; i < variables.length; i++) {
                        if (variables[i].Name == variable.Name) {
                            index = i;
                            break;
                        }
                    }
                    if (index == -1) {
                        variables.push(variable)
                    } else {
                        variables[index] = variable
                    }
                } else {
                    this.attributes.Variables = [variable];
                }
            },
            removeDependency: function (task) {
                var index = this.dependencies.indexOf(task);
                if (index != -1) {
                    this.dependencies.splice(index, 1);
                    this.trigger("change")
                }
            },
            setControlFlow: function (controlFlowType, task) {
                if (this['set' + controlFlowType]) this['set' + controlFlowType](task);
            },
            createif: function (task) {
                if (!this.controlFlow['if'] || !this.controlFlow['if'].task) {
                    this.setif(task);
                } else if (!this.controlFlow['if']['else']) {
                    this.setelse(task);
                } else if (!this.controlFlow['if']['continuation']) {
                    this.setcontinuation(task);
                }
            },
            removeControlFlow: function (controlFlowType, task) {
                if (this['remove' + controlFlowType]) this['remove' + controlFlowType](task);
            },
            setif: function (task) {
                if (!task) {
                    return;
                }
                this.set({'Control Flow': 'if'});
                if (!this.controlFlow['if']) {
                    this.controlFlow = {'if': {}}
                    this.controlFlow['if'].model = new FlowScript();
                }
                if(!this.controlFlow['if'].model) {
                    this.controlFlow['if'].model = new FlowScript();
                }
                this.controlFlow['if'].task = task;
            },
            setelse: function (task) {
                if (!task) {
                    return;
                }
                this.controlFlow['if']['else'] = {task: task};
            },
            setcontinuation: function (task) {
                if (!task) {
                    return;
                }
                this.controlFlow['if']['continuation'] = {task: task};
            },
            removeif: function (task) {
                this.set({'Control Flow': 'none'});
                if (this.controlFlow['if'].task == task) {
                    console.log('Removing IF')
                    delete this.controlFlow['if'].task;
                } else if (this.controlFlow['if']['else'] && this.controlFlow['if']['else'].task == task) {
                    console.log('Removing ELSE')
                    delete this.controlFlow['if']['else'];
                } else if (this.controlFlow['if']['continuation'] && this.controlFlow['if']['continuation'].task == task) {
                    console.log('Removing CONTINUATION')
                    delete this.controlFlow['if']['continuation'];
                }
                if (this.controlFlow['if'].task || this.controlFlow['if']['else'] && this.controlFlow['if']['else'].task || this.controlFlow['if']['continuation'] && this.controlFlow['if']['continuation'].task) {
                    // at least one branch is present
                } else {
                    console.log('Removing if branch', this.controlFlow, task)
                    this.set({'Control Flow': 'none'});
                    delete this.controlFlow['if'];
                }
            },
            setloop: function (task) {
                console.log('Adding loop')
                var currentScript;
                var currentModel;
                if (this.controlFlow['loop']) {
                    currentScript = this.controlFlow['loop'].script;
                    currentModel = this.controlFlow['loop'].model;
                }
                this.set({'Control Flow': 'loop'});
                this.controlFlow = {'loop': {task: task, model: new FlowScript()}}
                if (this.previousControlFlowLoopScript) {
                    this.controlFlow['loop'].script = this.previousControlFlowLoopScript;
                    this.controlFlow['loop'].model = this.previousControlFlowLoopModel;
                    this.previousControlFlowLoopScript = undefined;
                    this.previousControlFlowLoopModel = undefined;
                } else if (currentScript) {
                    this.controlFlow['loop'].script = currentScript;
                    this.controlFlow['loop'].model = currentModel;
                }
            },
            removeloop: function (controlFlow, task) {
                console.log('Removing loop')
                this.set({'Control Flow': 'none'});
                /*
                    Save the current script and model properties before deletion so that when you drop the loop on an empty space
                    and a groovy task is automatically created, the script will be copied in the new loop script.
                 */
                this.previousControlFlowLoopScript = this.controlFlow['loop'].script;
                this.previousControlFlowLoopModel = this.controlFlow['loop'].model;
                delete this.controlFlow['loop']
            },
            setreplicate: function () {
                console.log('Adding replicate')
                if (!this.controlFlow['replicate']) { // keep existing script if it is already defined
                    this.set({'Control Flow': 'replicate'});
                    this.controlFlow = {'replicate': {model: new FlowScript()}}
                }
            },
            removereplicate: function (controlFlow, task) {
                console.log('Removing replicate')
                this.set({'Control Flow': 'none'});
                delete this.controlFlow['replicate']
            },

            getBasicFields: function () {
                return [
                        "Task Name",
                        "Type",
                        "Host Name",
                        "Operating System",
                        "Required amount of memory (in mb)",
                        "Dedicated Host",
                        "Variables"]
            },
            addOrReplaceGenericInfo: function (key, value) {
                var genericInfo = this.get("Generic Info");
                if (!genericInfo) {
                    genericInfo = []
                }

                var found = false;
                for (var i in genericInfo) {
                    if (genericInfo[i]["Property Name"] == key) {
                        genericInfo[i]["Property Value"] = value;
                        found = true;
                    }
                }
                if (!found) {
                    genericInfo.push({"Property Name": key, "Property Value": value})
                }
                this.set("Generic Info", genericInfo)

            },
            commitSimpleForm: function (form) {
                var data = form.getValue();
                var selectionScripts = [];

                var name = "Host Name"
                if (data[name]) {
                    var selectionScript = {
                            Script: _.template(ssHostTemplate)({hostName: data[name]}),
                            "Language": "javascript",
                            Type: "dynamic"
                    };
                    selectionScripts.push(selectionScript)
                }
                this.addOrReplaceGenericInfo(name, data[name])

                name = "Operating System"
                    if (data[name] && data[name] != 'any') {
                        var selectionScript = {
                                Script: _.template(ssOSTemplate, {os: data[name]}),
                                "Language": "javascript",
                                Type: "dynamic"
                        };

                        selectionScripts.push(selectionScript)
                    }
                this.addOrReplaceGenericInfo(name, data[name])

                name = "Required amount of memory (in mb)"
                    if (data[name]) {
                        var selectionScript = {
                                Script: _.template(ssTotalMemTemplate, {mem: data[name]}),
                                "Language": "javascript",
                                Type: "dynamic"
                        };

                        selectionScripts.push(selectionScript)
                    }
                this.addOrReplaceGenericInfo(name, data[name])

                name = "Dedicated Host"
                    if (data[name]) {
                        this.set({"Topology": "singleHostExclusive"});
                        this.set({"Number of Nodes": 2});
                    } else {
                        this.set({"Topology": "arbitrary"});
                        this.set({"Number of Nodes": 1});
                    }
                this.addOrReplaceGenericInfo(name, data[name])

                this.set({"Selection Scripts": selectionScripts});
            },
            populateSimpleForm: function () {
                // initializing filed for simple form from generic info
                var genericInfo = this.get("Generic Info");

                if (!genericInfo) {
                    genericInfo = []
                }

                for (var i in genericInfo) {
                    var key = genericInfo[i]["Property Name"];
                    var value = genericInfo[i]["Property Value"];

                    // this metgod generates the link from the task.documentation GI value
                    this.generateDocumentUrl(genericInfo);

                    if (key == "Dedicated Host") {
                        value = (value === 'true');
                    }

                    this.set(key, value)
                }
            }
        })

        return Task;
    })
