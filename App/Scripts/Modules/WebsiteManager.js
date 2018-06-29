DefineModule("WebsiteManager",

    {
        singleInstance: true,
        requiresVersion: '3.0',
        created: new Date(2013, 09, 03),
        version: '1.0',
        author: 'Paul Fisher',
        copyright: 'Copyright 2015, Paul Fisher',

        changelog: [
            '03/09/13   PF  Created class.'
        ]
    },

    function (setup_) {

        //#region Members

        var _self = this;     
		var m_setup = setup_;		
		var m_pages = new Collection();
		var m_params = {};
		var m_devMode = false;
		var m_devToggle = false;
		var m_record = null;
		var m_page = null;		

        //#endregion

		this.Constructor = function (setup_) {
            m_setup = setup_;
        };
		
        //#region Public Methods

        this.OnLoad = function () {

            //Assign Module
            Website = this;    

		    Application.OnError = function(err){
				_self.HideLoad();
				if(err && err.message)
					err = err.message;
				swal({
					title: "Oops",
					text: err,
					type: "error",
					width: ($(window).width() < 438 ? $(window).width() - 60 : null)
				});
			};

			window.onpopstate = function(event) {				
				_self.Process();
			};
			
			$(window).unload(function () {
				try {

					if (Application.auth.SessionID != "") {
						Application.Disconnect();
					}

				} catch (e) {
				}
				return;
			});
			
			ExecuteQuery(m_setup.query,null,function(recs){

				if(recs[0].length == 0)
					Application.Error("Domain not found");	
				
				var domain = recs[0][0];
				
				eval("var func = function(){" + domain.OnLoad + "};");
				eval("var func2 = function(){" + domain.OnError + "};");
				
				m_setup.onload = func;
				m_setup.onerror = func2;
				m_setup.homepage = domain["Home Page"];		
				m_setup.webpagequery = domain["Web Page Query"];
				m_setup.domain = domain.Code;
				if(m_setup.onload)
					m_setup.onload();

				Application.RunNext(function(){

					var params = {};
					Application.LoadParams(params);	
					var skip = (params.page === domain["Header Page"]) || (params.page === domain["Footer Page"]);
					
					return $codeblock(
						function(){
							if(domain["Header Page"] && !skip)
								return _self.LoadHeader(domain["Header Page"]);
						},
						function(){
							if(domain["Footer Page"] && !skip)
								return _self.LoadFooter(domain["Footer Page"]);
						},
						function(){
							_self.Process();
						}
					);
				});					
			});
        };        
		
		this.AddPage = function(page){
			m_pages.Add(page.code,page);
		};
		
		this.SelectVersion = function(version_){
			LoadVersion(version_);
		};
		
		this.Process = function(){
						
			var params = {};
			Application.LoadParams(params);					
			
			if(!m_devMode && params && params.admin == "true"){
				m_devMode = true;	
				m_devToggle = true;
				SetupDeveloperTools(params);															
				$("body").append('<button type="button" class="btn btn-default btn-sm" style="position: fixed; left: 0px; bottom: 15px; z-index: 999999; opacity: 0.6;" onclick="Website.ToggleDev();">Dev</button>');
			}
						
			Website.LoadPage((params.page ? params.page : m_setup.homepage),params,true);				
		};
		
		this.Error = function(body){			
			if(m_setup.onerror)
				m_setup.onerror();
			_self.HideLoad();
			_self.Main().html('<br/><br/><br/><div class="alert alert-danger"><strong>Website Error!</strong> '+body+'</div>');
			throw "";
		};
		
		this.ProcessLinks = function(){
			
			var links = $("a");
			if(links.length > 0){							
				for(var j = 0; j < links.length; j++){
					var link = $(links[j]);
					if(link.attr("app-page") && link.attr("app-page") != ""){	
						link.css("cursor","pointer");
						link.unbind("click");
						link.on("click",function(){
							var p = $(this).attr("app-params");
							if(p){
								try{
									p = $.parseJSON(p);
								}catch(e){
									var p_arr = p.split(",");
									p = {};
									for(var i = 0; i < p_arr.length; i++){
										var param = p_arr[i].split("=");
										p[param[0]] = param[1];
									}
								}								
							}
							Website.LoadPage($(this).attr("app-page"),p);
						});
					}
				}
			}	
			
		};

		this.LoadHeader = function(code){							
			
			return $codeblock(
			
				function(){						
					return ExecuteQuery(m_setup.webpagequery,[code]);						
				},
				
				function(recs){																	
					
					if(recs[0].length == 0)
						Application.Error("Header page not found");	
					
					var p = recs[0][0];						
					_self.Header().html(p.TemplateHTML);						
				}
			);			
		};

		this.LoadFooter = function(code){							
			
			return $codeblock(
			
				function(){						
					return ExecuteQuery(m_setup.webpagequery,[code]);						
				},
				
				function(recs){																	
					
					if(recs[0].length == 0)
						Application.Error("Footer page not found");	
					
					var p = recs[0][0];						
					_self.Footer().html(p.TemplateHTML);						
				}
			);			
		};
		
		this.LoadPage = function(code,params,skiphistory){							
			
			$(window).scrollTop(0);
			if(m_devMode && m_record && m_record.Code != code){
					Application.RunNext(function(){
						FINDSET("Web Page",{Code:(code), Domain: m_setup.domain},function(wp){									
							m_record = wp;
							LoadVersion();
						});
					});
					var pstring = "";
					if(params)
						for(var p in params){
							if(p != "page"){						
								pstring += "&"+p+"="+params[p];											
							}
						}
						
					if(!skiphistory && window.history && window.history.pushState)
							window.history.pushState({page:code,params:params},m_page.title, (code == m_setup.homepage ? "/" : "/?page="+code+pstring));	
					return;
			}
				
				
			_self.ShowLoad();
			
			Application.RunNext(function(){						
				
				return $codeblock(
				
					function(){						
						return ExecuteQuery(m_setup.webpagequery,[code]);						
					},
					
					function(recs){																	
						
						if(recs[0].length == 0)
							Application.Error("The page you are looking for was not found");	
						
						var p = recs[0][0];
												
						if(m_devMode && m_record){
							p = m_record;
						}
						
						eval("var func = function(template,results){" + Default(p.OnFillTemplate,"return template;") + "};");
						eval("var func2 = function(){" + p.OnLoad + "};");
						eval("var func3 = function(){" + p.OnSetupQuery + "};");								

						m_params = params;											
						
						m_page = {
							code: p.Code,							
							title: p.Title,
							query: p.Query,
							filltemplate: func,
							onload: func2,
							setupquery: func3,
							template: p.TemplateHTML
						};

						var pstring = "";
						if(params)
							for(var p in params){
								if(p != "page"){						
									pstring += "&"+p+"="+params[p];											
								}
							}

						if(!skiphistory && window.history && window.history.pushState)
								window.history.pushState({page:code,params:params},m_page.title, (code == m_setup.homepage ? "/" : "/?page="+code+pstring));	

						document.title = m_page.title;											
						
						if(!m_page.query){
							
							var html = m_page.filltemplate(m_page.template);
							_self.Main().html(html);											
							_self.ProcessLinks();
							m_page.onload();
							return;
						}
						
						var params_arr = [];
						if(m_page.setupquery)
							params_arr = m_page.setupquery();													
						
						return ExecuteQuery(m_page.query,params_arr);
						
					},
					
					function(recs){																						
						
						recs = Default(recs,[]);
						
						var html = m_page.filltemplate(m_page.template,recs);
						_self.Main().html(html);											
						
						for(var i = 0; i < recs.length; i++){
							
							var recset = recs[i];
							
							var parent = $("[app-source='"+i+"']");
							if(parent.length > 0){
								
								for(var j = 0; j < parent.length; j++){
									
									var currparent = $(parent[j]);
									var repeat = null;
									
									if(currparent.attr("app-repeat")=="true"){
										repeat = parent[j].outerHTML;
									}
									
									if(recset.length == 0)
										currparent.remove();
									
									for(var k = 0; k < recset.length; k++){
										
										var rec = recset[k];
										
										for(var f in rec){
											var element = currparent.find("[app-field='"+f+"']");
											if(element.length > 0)
												element.html(rec[f]);
											currparent.html(currparent.html().replaceall("%"+i+"-"+f+"%",rec[f]));
										}
										
										if(repeat && k < recset.length - 1){
											var newparent = $(repeat);
											currparent.after(newparent);
											currparent = newparent;
										}
										
										if(!repeat)
											break;
										
									}
									
								}
							}
																				
						}																	
						
						_self.ProcessLinks();
						
						var jscode = $(".javascriptCode");
						jscode.each(function(index){
							var ce = jscode[index];
							var text = $(this).html();
							text = text.replace(/\<br\>/g,"\n");
							text = text.replace(/\&nbsp\;/g," ");			   
							var editor = CodeMirror(function(node){ce.parentNode.replaceChild(node, ce);}, {
								mode: "javascript",
								value: text,
								lineNumbers: true,
								lineWrapping: true,
								readOnly: true
							});
						});
						
						m_page.onload();		
						_self.HideLoad();						
					}
				);
			});
		};
			
		this.OnSearch = function(query, search, onclick, rowdef){	
		
		$(window).scrollTop(search.offset().top-60);
		
		 if(search.val() == "")
			 return;
		  Application.RunNext(function () {		
			return $codeblock(
			  function () {																	
				return ExecuteQuery(query,[search.val()]);
			  },
			  function (ret) {										
				$(".searchdropdown").remove();			
				ret = ret[0];
				if(ret.length !== 0){											
				  var dd = $("<div style='position:absolute; background-color: white; max-width: "+search.width()+"px; max-height: 400px; overflow-y: auto; z-index: 1001;' class='searchdropdown'>");
				  dd.css("width",search.width());
				  $("body").append(dd);
				  dd.css("top",search.offset().top+45).css("left",search.offset().left);
				  for(var i = 0; i < ret.length; i++){
					var item = $("<div rid='"+i+"' style='font-size: 14pt; padding: 5px; cursor: pointer;'>"+rowdef(ret[i])+"</div>");
					dd.append(item);
					item.on("click",function(){
						var i = $(this).attr("rid");
						onclick(ret[i]);
						$(".searchdropdown").remove();
					});
				  }											
				}														
			  }
			);
		  });
		};

		this.Main = function(){
			return $(m_setup.main);
		};
		
		this.Header = function(){
			return $(m_setup.header);
		};

		this.Footer = function(){
			return $(m_setup.footer);
		};

		this.DevBar = function(){
			return $(m_setup.devbar);
		};
		
		this.Params = function(){
			return m_params;
		};
		
		this.EditHTML = function(){
			EditMode();
		};
		
		this.ToggleDev = function(){
			if(m_devToggle){
				_self.DevBar().hide();
			}else{
				_self.DevBar().show();
			}
			m_devToggle = !m_devToggle;
		};
		
		this.DevMode = function(){
			return m_devMode;
		}
		
		this.ShowLoad = function(){
			if($("#divOverlay").length == 0){
				var o = $('<div id="divOverlay" style="position: fixed; top: 0px; left: 0px; opacity: .8; z-index: 30000;color: #EB8C79; background-color: #18506F;">'+
				'<div class="banner-container"> <div class="loading-banner"> LOADING <div class="loading-banner-left"></div> <div class="loading-banner-right"></div> </div> </div>'+
				'</div>');
				$("body").append(o);
				o.width('100%').height('100%');
			}
		};
		
		this.HideLoad = function(){
			$("#divOverlay").remove();
		};
		
		this.Publish = function(){
			Application.RunNext(function(){
				FINDSET("Web Page",{Code:(m_page.code ? m_page.code : m_setup.homepage), Domain: m_setup.domain, Published: true},function(wp){
					MODIFY(wp,"Published",false,function(){
						MODIFY(m_record,"Published",true,function(){
							FINDSET("Web Page",{Code:(m_page.code ? m_page.code : m_setup.homepage), Domain: m_setup.domain},function(wp){
								m_record = wp;
								LoadVersion();			
							});
						});	
					});
				});
			},null,null,true);
		};
		
		this.NewVersion = function(){
			Application.RunNext(function(){
				FINDSET("Web Page",{Code:(m_page.code ? m_page.code : m_setup.homepage), Domain: m_setup.domain},function(wp){
					if(wp.Count > 0){
						wp.Last();
						INSERT("Web Page",{
							Domain: m_record.Domain,
							Code: m_record.Code,
							Title: m_record.Title,
							Query: m_record.Query,
							OnFillTemplate: m_record.OnFillTemplate,
							OnLoad: m_record.OnLoad,
							OnSetupQuery: m_record.OnSetupQuery,
							TemplateHTML: m_record.TemplateHTML,
							Version: wp.Version+1
						},function(wp2){
							FINDSET("Web Page",{Code:(m_page.code ? m_page.code : m_setup.homepage), Domain: m_setup.domain},function(wp){
								
								m_record = wp;
								LoadVersion(wp2.Version);																	
								
							});
						});
					}
				});
			},null,null,true);
		};
		
		this.DeleteVersion = function(){
			if(m_record.Published)
				Application.Error("You cannot delete the published version");
			Application.RunNext(function(){
				DELETE(m_record,function(){
					FINDSET("Web Page",{Code:(m_page.code ? m_page.code : m_setup.homepage), Domain: m_setup.domain},function(wp){
						m_record = wp;
						LoadVersion();			
					});
				});
			},null,null,true);
		};
		
		this.EditVersion = function(){
			
			var divEdit = $('<div id="divEditVersion" style="position: fixed; left: 0px; top: 0px; width: 100%; height: 100%; z-index: 40000; overflow-y: auto; background-color: white; padding: 15px;">'+
			'<p>OnFillTemplate - function(template,results)</p><textarea id="txtOnFillTemplate">'+Default(m_record.OnFillTemplate,"")+'</textarea>'+
			'<p>OnLoad - function()</p><textarea id="txtOnLoad">'+Default(m_record.OnLoad,"")+'</textarea>'+
			'<p>OnSetupQuery - function()</p><textarea id="txtOnSetupQuery">'+Default(m_record.OnSetupQuery,"")+'</textarea>'+
			'<br/><br/><button id="btnCloseEdit" type="button" class="btn btn-default" data-dismiss="modal">Close</button></div>');
			
			$("body").append(divEdit);
			
			AddCodeEditor($("#txtOnFillTemplate")[0]);
			AddCodeEditor($("#txtOnLoad")[0]);
			AddCodeEditor($("#txtOnSetupQuery")[0]);
			
			$("#divDevTools").hide();
			
			$("#btnCloseEdit").unbind("click");
			$("#btnCloseEdit").on("click",function(){	
				Application.RunNext(function(){
						
						var onFillTemplate = $("#txtOnFillTemplate").val();
						if(onFillTemplate == "")
							onFillTemplate = null;
						var onLoad = $("#txtOnLoad").val();
						if(onLoad == "")
							onLoad = null;
						var onSetupQuery = $("#txtOnSetupQuery").val();
						if(onSetupQuery == "")
							onSetupQuery = null;
						
						divEdit.remove();
						$("#divDevTools").show();
						
						if(m_record.OnFillTemplate != onFillTemplate || m_record.OnLoad != onLoad || m_record.OnSetupQuery != onSetupQuery){
							
							if(!confirm("Save your changes?"))
								return;
							
							m_record.OnFillTemplate = onFillTemplate;
							m_record.OnSetupQuery = onSetupQuery;
							m_record.OnLoad = onLoad;
							
							MODIFY(m_record,null,null,function(){																
								_self.Process();
							});							
						}
				},null,null,true);				
			});
			
		};
		
		this.HTMLEditor = function(html, onsave){
			
			_self.Main().hide();
			
			//Add editor window.
			_self.Main().after('<div id="divEditor"></div>');								
		
			var edit = $("#divEditor");
			edit.html(html);
			edit.css({
				height: '100%',
				'min-height': 'calc(100vh - 50px)',
				'max-height': 'calc(100vh - 50px)',
				overflow: 'auto'
			});	
			edit.trumbowyg({
				fullscreenable: true,
				closable: true,
				btns: ['viewHTML',
				  '|', 'formatting',
				  '|', 'btnGrp-design',
				  '|', 'link',
				  '|', 'insertImage',					  
				  '|', 'btnGrp-justify',
				  '|', 'btnGrp-lists',
				  '|', 'horizontalRule']
			});
			
			var cssClass = 'trumbowyg-fullscreen';
			edit.parent().toggleClass(cssClass);
			$('body').addClass('trumbowyg-body-fullscreen');																			
			$(edit.parent().children()[0]).css('width', '100%');															
			$(".trumbowyg-fullscreen-button").hide();
			$(".trumbowyg-textarea").css('min-height','calc(100vh - 50px)');		

			edit.unbind("tbwclose");
			edit.on("tbwclose",function(){	
				Application.RunNext(function(){
						if(html != edit.html()){
							if(onsave)
								return onsave(edit.html());
						}
				},null,null,true);
				_self.Main().show();
				$("#divEditor").remove();
			});

			edit.show();
			
		};
		
		function ExecuteQuery(code, params_arr, callback){
			
			params_arr = Default(params_arr,[]);
								
			var params = Application.StrSubstitute('"param1_": "$1", "param2_": "$2", "param3_": "$3", "param4_": "$4", "param5_": "$5"',
				Default(params_arr[0],""),
				Default(params_arr[1],""),
				Default(params_arr[2],""),
				Default(params_arr[3],""),
				Default(params_arr[4],"")
				);					
			
			var w = $wait();
			
			Application.ExecuteEndpoint(Application.StrSubstitute(Application.url+'/q/?e=Server&m=ExecuteQueryJSONP&p={"instance_": "'+m_setup.instance+'", "code_": "$1", '+params+'}',code),function(results){
				if(callback){
					callback(FormatRecordset(results));
				}else{
					w.resolve(FormatRecordset(results));
				}
				
			},null,'jsonp');
			
			if(!callback)
			return w.promise();							
			
		};

		function FormatRecordset(results){
			
			var ret = [];
			for(var i = 0; i < results.length; i++){
				
				var ret2 = [];
				for(var j = 0; j < results[i].length; j++){
					
					var rec = {
						Table: results[i][j].Table,
						RecID: results[i][j].RecID
					};
					for(var k = 0; k < results[i][j].Fields.length; k++){
						rec[results[i][j].Fields[k].Name] = results[i][j].Fields[k].Value;
					}
					ret2.push(rec);
				}
				ret.push(ret2);
				
			}
			return ret;
			
		};
		
		function SetupDeveloperTools(params){
			
			//Create containers.
			var cont = $('<div style="padding: 10px;" />');
			_self.DevBar().append(cont);			
			var divLogin = $('<form id="divLogin" class="form-inline" />');
			cont.append(divLogin);
			var divDevTools = $('<div id="divDevTools" class="input-group" style="display: none;" />');
			cont.append(divDevTools);
			
			//Add login fields.			
			divLogin.append('<input id="txtUser" type="text" class="form-control input-sm" placeholder="Username">');
			divLogin.append('<input id="txtPass" type="password" class="form-control input-sm" placholder="Password">');
			divLogin.append('<button id="btnLogin" type="button" class="btn btn-default btn-sm">Login</button>');
			
			//Add dev bar buttons.			
			divDevTools.append('<span class="input-group-btn"><div class="dropdown"><button id="btnVersion" class="btn btn-primary dropdown-toggle btn-sm" type="button" data-toggle="dropdown"><span id="lblVersion">Versions</span>&nbsp;<span class="caret"></span></button><ul id="cmbVersions" class="dropdown-menu"></div></span>');
			divDevTools.append('<span class="input-group-btn"><div class="dropdown"><button class="btn btn-primary dropdown-toggle btn-sm" type="button" data-toggle="dropdown">Tools<span class="caret"></span></button><ul class="dropdown-menu">'+
			'<li><a onclick="Website.EditHTML();">Edit HTML</a></li>'+
			'<li><a onclick="Website.EditVersion();">Edit Page</a></li>'+
			'<li><a onclick="Website.Publish();">Publish</a></li>'+
			'<li><a onclick="Website.NewVersion();">New Version</a></li>'+
			'<li><a onclick="Website.DeleteVersion();" style="color: #e74c3c;">Delete Version</a></li>'+
			'</ul></div></span>');			
			divDevTools.append('<input id="txtTitle" type="text" class="form-control input-sm" placeholder="Page Title">');				
				
			$("#txtTitle").on("change",function(){
				Application.RunNext(function(){
						var val = $("#txtTitle").val();
						if(m_record.Title != val){							
							MODIFY(m_record,"Title",val,function(){
								m_record.Title = val;
								m_record.SaveCurrent();
								_self.Process();
							});							
						}
				},null,null,true);				
			});		
			
			$("#btnLogin").on("click",function(){
					_self.ShowLoad();
					Application.RunNext(function(){
						return $codeblock(
							function(){
								Application.auth = new Application.Objects.AuthInfo();
								Application.auth.Instance = m_setup.instance;
								Application.auth.Type = Application.authType.Login;
								Application.auth.Username = $("#txtUser").val();
								Application.auth.Password = $("#txtPass").val();
								return Application.Authorize();									
							},
							function(a){
								
								Application.auth = a;
								
								$("#divLogin").hide();
								$("#divDevTools").show();																		
								
								FINDSET("Web Page",{Code:(m_page.code ? m_page.code : m_setup.homepage), Domain: m_setup.domain},function(wp){
									
									m_record = wp;
									LoadVersion();
									_self.HideLoad();
									
								});
							}
						);

					});
			});
		};
		
		function EditMode(){
			
			_self.Main().hide();
			
			//Add editor window.
			_self.Main().after('<div id="divEditor"></div>');								
		
			var edit = $("#divEditor");
			edit.html(m_record.TemplateHTML);
			edit.trumbowyg({
				fullscreenable: true,
				closable: true,
				btns: ['viewHTML',
				  '|', 'formatting',
				  '|', 'btnGrp-design',
				  '|', 'link',
				  '|', 'insertImage',					  
				  '|', 'btnGrp-justify',
				  '|', 'btnGrp-lists',
				  '|', 'horizontalRule']
			});
			
			var cssClass = 'trumbowyg-fullscreen';
			edit.parent().toggleClass(cssClass);
			$('body').addClass('trumbowyg-body-fullscreen');									
			edit.css({
				'min-height': 'calc(100vh - 50px)',
				'max-height': 'calc(100vh - 50px)',
				overflow: 'auto'
			});									
			$(edit.parent().children()[0]).css('width', '100%');														
			$(".trumbowyg-fullscreen-button").hide();
			$(".trumbowyg-textarea").css('min-height','calc(100vh - 100px)');		

			edit.unbind("tbwclose");
			edit.on("tbwclose",function(){	
				Application.RunNext(function(){
						if(m_record.TemplateHTML != edit.html()){
							if(!confirm("Save your changes?"))
								return;
							MODIFY(m_record,"TemplateHTML",edit.html(),function(){
								m_record.TemplateHTML = edit.html();
								m_record.SaveCurrent();
								_self.Process();
							});							
						}
				},null,null,true);
				_self.Main().show();
				$("#divEditor").remove();
			});

			edit.show();
			
		};
		
		function LoadVersion(version_){
			
			$("#cmbVersions").empty();
									
			if(m_record.Count > 0){
				m_record.First();
				do{
					$("#cmbVersions").append('<li><a onclick="Website.SelectVersion('+m_record.Version+');">Version '+m_record.Version+(m_record.Published ? " (Published)" : "")+'</a></li>');						
				}while(m_record.Next());	
			}
			
			if(version_){
				SelectVersionByNumber(version_);
			}else{
				SelectVersionByPublished();
			}
							
			$("#lblVersion").html("Version: "+m_record.Version+(m_record.Published ? " (Published)" : ""));
			$("#txtTitle").val(m_record.Title);			
			
			if(m_record.Published){
				$("#btnVersion").removeClass("label-info");
				$("#btnVersion").addClass("label-success");
			}else{
				$("#btnVersion").addClass("label-info");
				$("#btnVersion").removeClass("label-success");
			}
			
			_self.Process();
			
		};
		
		function AddCodeEditor(element){
			var editor = CodeMirror.fromTextArea(element, {
                mode: "javascript",
                lineNumbers: true,
                viewportMargin: Infinity,
                lineWrapping: true,
                extraKeys: {
                    "Ctrl-Space": "autocomplete"
                },
                gutters: ["CodeMirror-lint-markers"],
                lint: true
            });
			editor.on("change", function(){
				$(element).val(editor.getValue());
			});
		};
		
		function SelectVersionByPublished(){			
			if(m_record.Count > 0){
				m_record.First();
				do{
						if(m_record.Published)
							return;
				}while(m_record.Next());	
			}
		};
		
		function SelectVersionByNumber(version_){
			if(m_record.Count > 0){
				m_record.First();
				do{
						if(m_record.Version == version_)
							return;
				}while(m_record.Next());	
			}
		};
		
        //#endregion
		
		this.Constructor(setup_);

    });
