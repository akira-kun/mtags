function mTags() {
	return {
		instanceName: "",
		multiTag: [],
		blockTag: [],
		scriptTag: [],
		template: [],
		nameTag: [],
		position: [],
		parent: [],
		children: [],
		regexTag: [],
		savedTemplates: {},
		index: 1,
		id: "",
		inputTemplate: "",
		inputJson: "",
		sendJson: "",
		funcHandle: null,
		processedTemplate: "",
		afterRenderFunction: null,
		appendHTML: false,
		separator: "<br>",
		returnFocus: true,
		reset: function() {
			this.multiTag = [];
			this.blockTag = [];
			this.scriptTag = [];
			this.template = [];
			this.nameTag = [];
			this.position = [];
			this.parent = [];
			this.children = [];
			this.regexTag = [];
			this.index = 1;
		},
		arraySeparator: function(separator) {
			this.separator = separator;
		},
		getInstanceName: function() {
			if (this.instanceName.length == 0) {
				for (var name in window) {
					if (window[name] == this) {
						this.instanceName = name;
						break;
					}
				}
			}
			return this.instanceName;
		},
		jsonVarName: "json",
		jsonSendVarName: function(name) {
			this.jsonVarName = name;
		},
		load: function (url, callback, data) {
			var instanceName = this.getInstanceName();
			try {
				var xhttp = new XMLHttpRequest();
				url += ((url.lastIndexOf("?") > -1) ? "&random="+Math.random() : "?random="+Math.random());
				var isJsonPost = false;
				if (data && typeof data === 'object') {
					data = this.jsonVarName+'=' + encodeURIComponent(JSON.stringify(data));
					isJsonPost = true;
				}
				else if (typeof data === 'string') {
					data = this.jsonVarName+'=' + encodeURIComponent(data);
					isJsonPost = true;
				}
				xhttp.open(isJsonPost ? 'POST' : 'GET', url, true);
				xhttp.setRequestHeader('Content-Type', (isJsonPost) ? "application/x-www-form-urlencoded" : 'application/json; charset="utf-8"');
				xhttp.setRequestHeader("Cache-Control", "no-store, no-cache, must-revalidate, private");
				xhttp.setRequestHeader("pragma", "no-cache");
				xhttp.onreadystatechange = function () {
					if (xhttp.readyState == 4) {
						if (callback) {
							if (typeof callback === 'function') {
								callback(xhttp.responseText);
							} else if (window[instanceName][callback]) {
								window[instanceName][callback](xhttp.responseText);
							}
						}
					}
				};
				xhttp.send(data);
			} catch (e) {
				window.console && console.log(e);
			}
		},
		funcHandleJson: function(data) {
			if (typeof this.funcHandle === "function") { 
				return this.funcHandle(data);
			}
			return data;
		},
		getTemplate: function() {
			var t = this.inputTemplate;
			if (t && typeof t === "string" && t.length > 0) {
				if (document.getElementById(t) != null) {
					if (t.length < 251 && this.savedTemplates[t] != null) {
						this.inputTemplate = this.savedTemplates[t];
					} else {
						this.savedTemplates[t] = this.inputTemplate = document.getElementById(t).innerHTML;
					}
					this.getJson();
				}
				else if (/[\[\]\{\}]+/.test(t)) {
					this.getJson();
				} else {
					if (t.length < 251 && this.savedTemplates[t] != null) {
						this.inputTemplate = this.savedTemplates[t];
						this.getJson();
					} else {
						this.load(t, "getRemoteTemplate");
					}
				}
			}
			else
			{
				this.getJson();
			}
		},
		getRemoteTemplate: function(t) {
			this.savedTemplates[this.inputTemplate] = this.inputTemplate = t;
			this.getJson();
		},
		isJson: function(str) {
			try {
				JSON.parse(str);
			} catch (e) {
				return false;
			}
			return true;
		},
		getJson: function() {
			var json = this.inputJson;
			if (json && typeof json === "object" && json !== null) {
				this.trigger();
			}
			if (json && typeof json === "string" && json !== null) {
				if (this.isJson(json)) {
					this.inputJson = JSON.parse(json);
					this.trigger();
				}
				else {
					this.load(this.inputJson, "getRemoteJson", this.sendJson);
				}
			}
		},
		getRemoteJson: function(json) {
			if (this.isJson(json)) {
				this.inputJson = JSON.parse(json);
				this.trigger();
			} else {
				console.error("Invalid JSON input!");
			}
		},
		isArray: function(what) {
			return Object.prototype.toString.call(what) === '[object Array]';
		},
		inArray: function (needle, haystack) {
	   		var length = haystack.length;
			for(var i = 0; i < length; i++) {
		   		if(haystack[i] == needle) return i;
			}
	   		return false;
		},
		key: function(jsonArray,key) {
			var keys=Object.keys(jsonArray);
			for(var i=0;i<keys.length;i++) {
				if(jsonArray[keys[i]].hasOwnProperty(key)) {
					return keys[i];
				}
			}
			return false;
		},
		searchTagInsideBlock: function(indexBlock,tagName) {
			if (this.isArray(this.children[indexBlock])) {
				for (var i in this.children[indexBlock]) {
					if (this.nameTag[this.children[indexBlock][i]] == tagName) {
						return true;
					}
				}
			}
			return false;
		},
		hasSinblingObject: function(json) {
			if (typeof json === "object") {
				var keys=Object.keys(json);
				for(var i=0;i<keys.length;i++) {
					if(typeof json[keys[i]] === "object" && Object.keys(json[keys[i]]).length > 0) {
						return true;
					}
				}
			}
			return false;
		},
		replaceRange: function (s, start, end, substitute) {
			return s.substring(0, start) + substitute + s.substring(end);
		},
		htmlEntities: function (str) {
			return "<pre>"+String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')+"</pre>";
		},
		trigger: function() {
			this.parseTemplate(this.inputTemplate, 0);
			this.processJsonTemplate(this.id,this.inputJson,0);
		},
		parseTemplate: function(inputTemplate, index) {
			this.reset();
			this.template[index] = this.parse(this.preParse(inputTemplate), 0);
		},
		processJsonTemplate: function(id,inputJson,index) {
			this.inputJson = this.funcHandleJson(inputJson);
			if (/(\(\$([\w\-\_]+[\.\w\-\_]*)\))/.test(this.inputTemplate) && typeof this.updateIndex === "number" && this.sendJson) {
				this.parseTemplate(this.inputTemplate, 0);
			}
			if (this.nameTag[index] == Object.keys(inputJson)[0] && Object.keys(inputJson).length == 1 && typeof inputJson[Object.keys(inputJson)[0]] === "string") {
				this.inputJson = inputJson[Object.keys(inputJson)[0]];
			}
			this.processedTemplate = this.build(this.inputJson,index,this.template[index]);
			this.processedTemplate = this.processedTemplate.replace(/&#91;/g, '[').replace(/&#93;/g, ']');

			if (this.processedTemplate != null) {
				this.processedTemplate = this.processedTemplate.replace(/\[\d+\]/gm,"");
				if (this.appendHTML) {
					var obj = document.createElement("div");
					obj.innerHTML = this.processedTemplate;
					var objChildren = obj.childNodes;
					var objLength = objChildren.length;
					var objsAppend = [];
					for (var i in objChildren) {
						if (objChildren[i] && objChildren[i].nodeType != null) {
							objsAppend[objsAppend.length] = objChildren[i];
						}
					}
					if (id != null) {
						for (var i in objsAppend) {
							document.getElementById(id).appendChild(objsAppend[i]);
						}
					}
					//alert(objsAppend.length);
				} else {


					var obj = document.createElement("div");
					obj.innerHTML = this.processedTemplate.trim();

					if (id != null) {

						if (this.multiRenderTrigger) {
							this.multiRenderTrigger = false;

							var inc = 0;
							do {
								this.multiRenderId = id+"-"+(document.getElementById(id).childNodes.length+inc++);
							} while (document.getElementById(this.multiRenderId) != null);

							var mObj = document.createElement(document.getElementById(id).nodeName);
							mObj.id = this.multiRenderId;
							mObj.innerHTML = this.processedTemplate;
							
							document.getElementById(id).insertBefore(mObj, document.getElementById(id).childNodes[0]);
							//alert(1);
							//document.getElementById(id).appendChild(mObj);

						} else {
							if (obj.firstChild != null && obj.firstChild.nodeName == document.getElementById(id).nodeName && obj.firstChild.id == document.getElementById(id).id) {
								document.getElementById(id).outerHTML = this.processedTemplate;
							} else {
								document.getElementById(id).innerHTML = this.processedTemplate;
							}							
						}

						if (this.returnFocus) {
							var itab = window.lastTab || document.activeElement.tabIndex;

							window.tabIndex = 0;
							window.tabMax = 0;
							var els = document.body.querySelectorAll('button,input,select,textarea');
							
							Array.prototype.forEach.call(els, function(el) {
								window.tabMax = window.tabIndex;
								el.setAttribute('tabIndex',window.tabIndex++);
								if (el.getAttribute('tabIndex') == itab) {
									el.focus();
								}
								el.addEventListener('focus',function() {
									window.lastTab = this.getAttribute('tabIndex');
								});
								el.addEventListener('keydown',function(e) {
									if (e.keyCode == 9) {
										window.lastTab = (parseInt(this.getAttribute('tabIndex'))+1 > window.tabMax) ? 0 : parseInt(this.getAttribute('tabIndex'))+1;
									}
									if(e.shiftKey && e.keyCode == 9) {
										window.lastTab = (parseInt(this.getAttribute('tabIndex'))-1 > 0) ? parseInt(this.getAttribute('tabIndex'))-1 : window.tabMax;
									}
								});
							});
						}
					}

				}
				if (id != null) {
					this.evalJSFromHtml(obj);
				}
			}
			this.appendHTML = false;
			this.updateIndex = null;

			if (this.afterRenderTrigger && typeof this.afterRenderFunction === "function") {
				this.afterRenderTrigger = false;
				this.afterRenderFunction(this);
			}
		},
		evalJSFromHtml: function(obj) {
			var scripts = obj.getElementsByTagName("script");
			for (var i = 0; i < scripts.length; i++) {
				scripts[i].innerHTML = scripts[i].innerHTML.replace(/function\s+(.*)\s*\(/g, 'window.$1 = function(');
				eval(scripts[i].innerHTML);
			}
		},
		searchPartialTemplate: function(index,path,pathIndex) {
			var childrenTags = this.children[index];
			var lengthChildrenTags = childrenTags.length;
			for(var i = 0; i < lengthChildrenTags;i++) {
				if (path[pathIndex] == this.nameTag[childrenTags[i]] && this.blockTag[childrenTags[i]]) {
					if (pathIndex < path.length-1) {
						return this.searchPartialTemplate(childrenTags[i],path,++pathIndex);
					} else {
						return childrenTags[i];
					}
				}
			}
		},
		updateIndex: "",
		update: function(id, pathTags, inputJson, sendJson, funcHandle) {
			if (funcHandle == null && typeof sendJson === "function") {
				funcHandle = sendJson;
				sendJson = null;
			} else {
				this.sendJson = sendJson;
			}
			//Resuse partial template
			if (this.children[0] && this.children[0].length > 0) {
				this.updateIndex = (pathTags && pathTags.toLowerCase() != "root") ? this.searchPartialTemplate(0,pathTags.split('.'),0) : 0;
				if (inputJson == null) {
					document.getElementById(id).innerHTML='';
					return '';
				}
				inputJson = (inputJson) ? inputJson : {};
				if (this.updateIndex == null) {
					if (!this.appendHTML) {
						console.error("Error: partial template "+pathTags+" not found!");
					}
				} else {
					this.funcHandle = funcHandle;
					if (inputJson && typeof inputJson === "object" && inputJson !== null) {
						this.processJsonTemplate(id,inputJson,this.updateIndex);
					}
					if (inputJson && typeof inputJson === "string" && inputJson !== null) {
						if (this.isJson(inputJson)) {
							this.inputJson = JSON.parse(inputJson);
							this.processJsonTemplate(id,inputJson,this.updateIndex);
						}
						else {
							this.id = id;
							this.load(inputJson, "updateJsonTemplate", sendJson);
						}
					}
				}
				this.appendHTML = false;
			}
		},
		updateJsonTemplate: function(json) {
			if (this.isJson(json)) {
				this.inputJson = JSON.parse(json);
				this.processJsonTemplate(this.id,this.inputJson,this.updateIndex);
			}
		},
		append: function(id, pathTags, inputJson, sendJson, funcHandle) {
			this.appendHTML = true;
			this.update(id, pathTags, inputJson, sendJson, funcHandle);
			if (this.appendHTML) {
				this.render(id, pathTags, inputJson, sendJson, funcHandle);
				this.appendHTML = false;
			}
			if (this.appendHTML) {
				console.error("append has fail!");
			}
		},
		multiRenderTrigger: false,
		multiRenderId: "",
		multiRender: function(id, template, input, send, funcHandle) {
			if (document.getElementById(id) != null) {				
				this.multiRenderTrigger = true;
				this.render(id, template, input, send, funcHandle);
			}
		},
		getFromUrl: function(url, sendJson, funcHandle) {
			if (funcHandle == null && typeof sendJson === "function") {
				funcHandle = sendJson;
			}
			this.load(url, funcHandle, sendJson);
		},
		afterRenderTrigger: false,
		afterRender: function(f) {
			this.afterRenderTrigger = true;
			this.afterRenderFunction = f;
		},
		render: function(id, template, input, send, funcHandle) {
			if (funcHandle == null && typeof send === "function") {
				funcHandle = send;
				sendJson = null;
			}
			if (input == null) {
				document.getElementById(id).innerHTML='';
				return '';
			}
			this.id = id;
			this.inputTemplate = template;
			this.inputJson = (input) ? input : {};
			this.sendJson = send;
			this.funcHandle = funcHandle;
			this.getTemplate();
			return this.processedTemplate.trim();
		},
		matchKeyRegex: function (key,pattern) {
			try {
				if (pattern.indexOf("/") === 0) {
					var opts = pattern.split("/")[2];
					if (opts) {
						pattern = pattern.substring(0,pattern.lastIndexOf("/")+1);
					}
					if (key.match(new RegExp(pattern.substring(1,pattern.length-1),opts)) !== null) {
						return true;
					}
				}
			} catch(e) {
				console.error("Invalid regular expression: "+pattern);			
			}
			return false;
		},
		jsonPathValue: function (path,value,debug) {
			var keys = path.split(".");
			var keysLength = keys.length;
			var obj = app.inputJson;

			//alert("inicio "+JSON.stringify(keys,null,2));
			for (var i = 0;i < keysLength;i++) {
				id = keys[i].replace(/^[\(]*([\d]+)\)$/g,'$1');
				if (keys[i].length != id.length) {
					id = parseInt(id);
				}
				if (debug) {
					alert("key "+JSON.stringify(id,null,2));
				}
				if (obj[id] != null) {
					if (i < keysLength-1) {
						obj = obj[id];
						if (debug) {
							alert("obj: "+JSON.stringify(obj,null,2));
						}
					} else {
						if (value != null) {
							obj[id] = value;
						}
						if (debug) {
							alert("value: "+JSON.stringify(obj));
						}
						return obj[id];
					}
				}
			}
			return false;
		},
		showTagsErrors: true,
		fixArrayObj: false,
		build: function(obj,index,str,toReplace,path,children) {

			if (toReplace == null) {
				var toReplace = {};
			}

			if (this.children[index] == null) {
				return "";
			}

			var indexTag = this.children[index];
			var indexTagLength = indexTag.length;

			if (typeof obj === "string") {
				return obj;
			}

			for (var key in obj) {

				if (this.isArray(obj)) {
					if (Object.keys(obj[key]).length > 1 || this.fixArrayObj) {
						if (!strs) var strs = [];
						strs.push(this.build(obj[key],index,str,null,(path ? path+".(" : "")+key+")",Object.keys(obj[key])));
						if (strs.length == obj.length) {
							str = strs.join("");
							//delete strs;
						}
					} else {
						toReplace = this.build(obj[key],index,null,toReplace,(path ? path+".(" : "")+key+")",Object.keys(obj[key]));
					}
				} else {

					if (obj[key] == null) {
						continue;
					}

					var writeTag = [];
					var sublevelIndex = "";
					var found = false;

					//Try to discover the original reference Tag index and local level tags to replace
					//Search on singleTags, multiTags.
					if (indexTagLength > 0) {

						//search only singleTags and multiTags
						var type = "";
						for (var i = 0; i < indexTagLength; i++) {

							var tags = this.nameTag[indexTag[i]].split('|');
							var tagsLength = tags.length;
							if (tagsLength > 0) {
								for (var j = 0; j < tagsLength; j++) {
									if (!this.blockTag[indexTag[i]] && (tags[j] == key || (this.regexTag[index].length > 0 && this.inArray(indexTag[i],this.regexTag[index]) !== false && this.matchKeyRegex(key,tags[j]))) !== false) {
										writeTag[writeTag.length] = indexTag[i];
										sublevelIndex = this.multiTag[indexTag[i]][j];
										//Regex Foreach Key => Value
										if (this.regexTag[index].length > 0 && this.inArray(indexTag[i],this.regexTag[index]) !== false && this.matchKeyRegex(key,tags[j]) && key != "key") {
											if (typeof obj[key] == "object" && !this.isArray(obj[key])) {
												if(!obj[key].hasOwnProperty('key')) {
													obj[key].key = key;
												}
											} else {
												if (this.searchTagInsideBlock(this.multiTag[indexTag[i]][j],"key") || this.searchTagInsideBlock(this.multiTag[indexTag[i]][j],"value")) {
													if (!this.hasSinblingObject(obj[key])) {
														obj[key] = { "key": key, "value": obj[key] };
													} else if (this.searchTagInsideBlock(this.multiTag[indexTag[i]][j],"key") && !obj[key].hasOwnProperty('key')) {
														if (this.isArray(obj[key])) {
															if (!this.key(obj[key],"key")) {
																obj[key].push({"key": key});
															}
														} else {
															obj[key].key = key;
														}
													}
												}
											}
										}
										found = true;
									}
								}
							}
						}
						//search only blockTags
						if (!found) {
							for (var i = 0; i < indexTagLength; i++) {
								var tag = this.nameTag[indexTag[i]];

								if (this.blockTag[indexTag[i]] && (tag == key || this.matchKeyRegex(key,tag))) {
									sublevelIndex = writeTag[writeTag.length] = indexTag[i];

									if (this.matchKeyRegex(key,tag) && key != "key") {
										//alert("ANTES\n"+JSON.stringify(obj)+"\n"+this.searchTagInsideBlock(indexTag[i],"key"));
										if (typeof obj[key] == "object" && !this.isArray(obj[key])) {
											if(!obj[key].hasOwnProperty('key')) {
												//alert("key");
												obj[key].key = key;
											}
										} else {
											if (this.searchTagInsideBlock(indexTag[i],"key") || this.searchTagInsideBlock(indexTag[i],"value")) {
												if (!this.hasSinblingObject(obj[key])) {
													//alert("key / value");
													obj[key] = { "key": key, "value": obj[key] };
												} else if (this.searchTagInsideBlock(indexTag[i],"key") && !obj.hasOwnProperty('key')) {
													//alert("parent key OBJ");
													if (this.isArray(obj[key])) {
														if (!this.key(obj[key],"key")) {
															obj[key].push({"key": key});
														}
														if (!this.key(obj[key],"key")) {
															obj[key].push({"key": key});
														}
													} else {
														obj[key].key = key;
													}
												}
											}
										}
										//alert("DEPOIS\n"+JSON.stringify(obj)+"\n"+this.searchTagInsideBlock(indexTag[i],"key"));
									}
									found = true;
									break;
								}
							}
						}
						if (false) {
							//TODO
							//search in parent obj
							if (indexTagLength > 0) {
								for (var i = 0; i < indexTagLength; i++) {
									var tag = this.nameTag[indexTag[i]];

									if (tag.indexOf("parent.") > -1) {
										var parentKeys = Object.keys(parent);
										for (var pKey in parentKeys) {
											alert(tag+" = "+JSON.stringify(parent))
											if (tag.replace("parent.","") == pKey) {
												alert(tag+" / "+JSON.stringify(parentKeys[pKey]));
											}
										}
									}
								}
							}
						}
						//REGISTER
						if (found) {
							if ((typeof obj[key] == "object" && !this.isArray(obj[key])) || (typeof obj[key] == "object" && this.isArray(obj[key]) && obj[key].length > 0 && typeof obj[key][0] == "object") || (this.isArray(obj[key]) && obj[key].length == 0)) {
								var content = this.build(obj[key],sublevelIndex,this.template[sublevelIndex],null,(path ? path+"." : "")+key,Object.keys(obj[key]));
							} else {
								var content = (this.isArray(obj[key])) ? obj[key].join(this.separator) : obj[key];
							}
							for (var j in writeTag) {
								if (toReplace[writeTag[j]] == null) {
									toReplace[writeTag[j]] = [];
								}
								toReplace[writeTag[j]][toReplace[writeTag[j]].length] = content;
							}
						}

					} 
					if (!found && this.showTagsErrors) {
						if (key != "key" && key != "value") {
							console.error("["+key+"] key tag not found on template or not reachable from this sublevel!")
						}
					}
				}
			}

			//process bottom up replacement
			var position = {};

			if (str != null) {
				if (indexTagLength > 0) {
					for (var i = indexTagLength-1; i >= 0; i--) {

						var nestedTag = false;
						if (this.nameTag[indexTag[i]].indexOf("parent.") > -1 || this.nameTag[indexTag[i]].indexOf("this.") > -1) {
							nestedTag = true;
						}

						if (toReplace[indexTag[i]] != null || (nestedTag && Object.keys(toReplace).length > 0)) {
							if (nestedTag) {

								if (toReplace[indexTag[i]] == null) {
									toReplace[indexTag[i]] = [];
								}

								var parentTags = this.nameTag[indexTag[i]].split(".");
								var foundParentTag = false;

								if (this.nameTag[indexTag[i]].indexOf("parent.children") > -1) {

									//alert(JSON.stringify(children));
									if (parentTags[2] != null) {
										foundParentTag = true;
										var parentObj = children[parseInt(parentTags[2])];
									}

								} else if (this.nameTag[indexTag[i]].indexOf("parent.") > -1) {
									
									foundParentTag = true;

									var parentTagsLength = parentTags.length;
									var parentPath = path;
									var parentObj = this.jsonPathValue(parentPath);
									var lastParentKey = "";
									for (var pTag in parentTags) {
										pTag = parentTags[pTag];
										if (pTag == "parent") {

											if (parentPath.lastIndexOf(".") > -1) {
												while(parentPath.substring(parentPath.lastIndexOf(".")+1).indexOf("(") === 0) {
													parentPath = parentPath.substring(0,parentPath.lastIndexOf("."));
												}
												parentObj = this.jsonPathValue(parentPath);
												lastParentKey = parentPath.substring(parentPath.lastIndexOf(".")+1);
												parentPath = parentPath.substring(0,parentPath.lastIndexOf("."));
											} else {
												lastParentKey = parentPath;
											}

										} else if (pTag == "key") {

											parentObj = lastParentKey;
											break;

										} else {

											if (isNaN(pTag) && this.isArray(parentObj)) {
												for (var j in parentObj) {
													if (typeof parentObj[j] === "object" && parentObj[j][pTag] != null) {
														parentObj = parentObj[j][pTag];
													}
												}
											} else {
												if (!parentObj[pTag]) {
													break;
												}
												parentObj = parentObj[pTag];
											}

										}
									}

									if (typeof parentObj === "object" || parentObj == null) {
										foundParentTag = false;
									}

								} else if (this.nameTag[indexTag[i]].indexOf("this.jsonPath") > -1) {

									foundParentTag = true;
									var parentObj = path;

								}

								if (foundParentTag) {
									toReplace[indexTag[i]].push(parentObj);
								}
							}

							if (position[indexTag[i]] == null) {
								position[indexTag[i]] = [];
								position[indexTag[i]][0] = this.position[indexTag[i]][0];
								position[indexTag[i]][1] = this.position[indexTag[i]][1];
							}
							for (var j in toReplace[indexTag[i]]) {
								str = this.replaceRange(str, position[indexTag[i]][0], position[indexTag[i]][1], toReplace[indexTag[i]][j]+"["+indexTag[i]+"]");
								position[indexTag[i]][0]+= toReplace[indexTag[i]][j].toString().length;
								position[indexTag[i]][1]+= toReplace[indexTag[i]][j].toString().length;
							}
						}
					}
				}
				//alert(str);
				return str;
			}
			return toReplace;
		},
		preParse: function (str,json,funcHandle) {

			if (funcHandle == null && typeof json === "function") {
				funcHandle = json;
				json = null;
			}

			/****** DYNAMIC TAGS *******/
			if (typeof this.sendJson === "object" || typeof json === "object") {
				var dTags = [];
				var re = /(\(\$([\w\-\_]+[\.\w\-\_]*)\))/g; 
				var m;
				while ((m = re.exec(str)) !== null) {
					if (m.index === re.lastIndex) {
						re.lastIndex++;
					}
					dTags[dTags.length] = m[2];
				}
				var dVarArray = {};
				for (var i in dTags) {
					var keyObj = dTags[i].split(".");
					var dVar = (json != null) ? json : this.sendJson;
					for (var key in keyObj) {
						if (dVar[keyObj[key]]) {
							dVar = dVar[keyObj[key]];
							if (this.isArray(dVar)) {
								//End of keyObj 
								if (keyObj.length-1 == key) {
									if (dVarArray[keyObj.join(".")] == null) {
										dVarArray[keyObj.join(".")] = 0;
									} else {
										dVarArray[keyObj.join(".")]++;
									}
									dVar = (dVar[dVarArray[keyObj.join(".")]] != null) ? dVar[dVarArray[keyObj.join(".")]] : "";
								}
							}
						}
					}
					if (typeof funcHandle === "function") {
						var temp = funcHandle.apply(this,[dTags[i],dVar]);
						dVar = (temp != null) ? temp : "";
					}
					if (typeof dVar !== "object") {
						str = str.replace("($"+dTags[i]+")", dVar);
					} else {
						str = str.replace("($"+dTags[i]+")", "");
					}
				}
			}

			/******** COMMENTS **********/
			var re = /(\[\[)([\]]*)/g;
			var subst = '&#91;$2';
			str = str.replace(re, subst);
			var re = /([\]]*)(\]\])/g;
			var subst = '$1&#93;';
			str = str.replace(re, subst);

			/******** MTAGS INSTANCE OBJECTS **********/
			str = str.replace(/\(mTagObject\)/g, this.instanceName);

			return str;
		},
		parse: function (str,parent) {
			var re = /(\[((?:[^\[\]]+|(\[((?:[^\[\]]+|\[((?:[^\[\]]+|(\[((?:[^\[\]]+|\[.*\])*)\]))*)\])*)\]))*|[^\]]+)\])([\n|\s]*)({{(?:[^}{]+(\n*[^{]\n*[{]\n*[^{]|[}]\n*[^}]\n*)*[^}{]+|{{(?:[^}{]+(\n*[^{]\n*[{]\n*[^{]|[}]\n*[^}]\n*)*[^}{]+|{{(?:[^}{]+(\n*[^{]\n*[{]\n*[^{]|[}]\n*[^}]\n*)*[^}{]+|{{(?:[^}{]+(\n*[^{]\n*[{]\n*[^{]|[}]\n*[^}]\n*)*[^}{]+|{{(?:[^}{]+(\n*[^{]\n*[{]\n*[^{]|[}]\n*[^}]\n*)*[^}{]+|{{(?:[^}{]+(\n*[^{]\n*[{]\n*[^{]|[}]\n*[^}]\n*)*[^}{]+|{{(?:[^}{]+(\n*[^{]\n*[{]\n*[^{]|[}]\n*[^}]\n*)*[^}{]+|{{(?:[^}{]+(\n*[^{]\n*[{]\n*[^{]|[}]\n*[^}]\n*)*[^}{]+|{{(?:[^}{]+(\n*[^{]\n*[{]\n*[^{]|[}]\n*[^}]\n*)*[^}{]+|{{(?:[^}{]+(\n*[^{]\n*[{]\n*[^{]|[}]\n*[^}]\n*)*[^}{]+|{{(?:[^}{]+(\n*[^{]\n*[{]\n*[^{]|[}]\n*[^}]\n*)*[^}{]+|{{[^}{]*(\n*[^{]\n*[{]\n*[^{]|[}]\n*[^}]\n*)*[^}{]*}})*}})*}})*}})*}})*}})*}})*}})*}})*}})*}})*}})*/g;
			var m;
			var d;
			var index;
			var start = index = this.index;

			var multiTag = [];
			var blockTag = [];
			var scriptTag = [];
			this.children[parent] = [];
			while ((m = re.exec(str)) !== null) {
				if (m.index === re.lastIndex) {
					re.lastIndex++;
				}
				else
				{
					index = this.index;
					var template = str.substring(m.index,re.lastIndex);
					this.template[index] = "";
					this.multiTag[index] = false;
					this.blockTag[index] = false;
					this.children[parent][this.children[parent].length] = index;
					//find non block tag
					if (template.indexOf("{{") == -1) {
						//fix position
						re.lastIndex-=m[8].length;
						//find pure script tag [?(...)]
						if (template.indexOf("(") == 1 || template.indexOf("(") == 2) {
							this.scriptTag[index] = true;
							scriptTag[scriptTag.length] = index;
						}
						//find multitag with script [tag|n..tags|?()]
						else if (template.indexOf("|") > -1 && template.indexOf("(") > -1) {
							this.multiTag[index] = true;
							multiTag[multiTag.length] = index;
						}
						//find multitag [tag|n..tags]
						else if (template.indexOf("|") > -1) {
							this.multiTag[index] = true;
							multiTag[multiTag.length] = index;
						}
						//singleTag [tag]
						else {
							this.multiTag[index] = true;
							multiTag[multiTag.length] = index;
						}
					//blockTag
					} else {
						this.blockTag[index] = true;
						blockTag[blockTag.length] = index;
						this.template[index] = (m[9] != null) ? m[9].substring(2,m[9].length-2) : '';
					}
					//regexTag
					if (this.regexTag[parent] == null) {
						this.regexTag[parent] = [];
					}
					if (/\[.*\/.*\/.*\]/.test(m[1])) {
						this.regexTag[parent][this.regexTag[parent].length] = index;
					}
					this.parent[index] = parent;
					this.nameTag[index] = m[2];
					var newTag = "["+index+"]";
					str = this.replaceRange(str, m.index, re.lastIndex, newTag);
					re.lastIndex = m.index + newTag.length;
					this.position[index] = [m.index,re.lastIndex];
					this.index++;
				}
			}
			//process multitags templates
			if (multiTag.length > 0) {
				for (var j in multiTag) {
					var tags = this.nameTag[multiTag[j]].split("|");
					this.multiTag[multiTag[j]] = [];
					for (var tag in tags) {
						var found = false;
						//Normalize Regex Tag
						if (/.*\/.*\/.*/.test(tags[tag])) {
							//tags[tag] = tags[tag].replace("(.+)$","");
						}
						//search siblings
						for (i = start;i <= index;i++) {
							if (multiTag[j] != i && this.blockTag[i] && tags[tag] == this.nameTag[i]) {
								this.multiTag[multiTag[j]][this.multiTag[multiTag[j]].length] = i;
								found = true;
								break;
							}
						}
						//search parents
						if (!found) {
							var parentNode = this.parent[multiTag[j]];
							while (parentNode > 0) {
								if (multiTag[j] != parentNode && tags[tag] == this.nameTag[parentNode]) {
									this.multiTag[multiTag[j]][this.multiTag[multiTag[j]].length] = parentNode;
									found = true;
									break;
								}
								parentNode = this.parent[parentNode];
							}
						} 

						//search in root level
						if (!found)	{
							for (var i in this.children[0]) {
								if (multiTag[j] != this.children[0][i] && this.blockTag[this.children[0][i]] && tags[tag] == this.nameTag[this.children[0][i]]) {
									this.multiTag[multiTag[j]][this.multiTag[multiTag[j]].length] = this.children[0][i];
									found = true;
									break;
								}
							}					
						} 
						//not found, set itself
						if (!found)	{
							if (this.nameTag[multiTag[j]].indexOf("|") > 0)	{
								this.multiTag[multiTag[j]][this.multiTag[multiTag[j]].length] = multiTag[j];
							}
						}
					}
				}
			}

			//parse recursively block tags
			if (blockTag.length > 0) {
				for (var j in blockTag) {
					this.template[blockTag[j]] = this.parse(this.template[blockTag[j]],blockTag[j]);
				}
			}
			return str;
		}
	}
}