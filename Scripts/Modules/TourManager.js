DefineModule("TourManager",

    {
        singleInstance: true,
        requiresVersion: '3.0',
        created: new Date(2015, 07, 19),
        version: '1.0',
        author: 'Paul Fisher',
        copyright: 'Copyright 2015, Paul Fisher',
        changelog: []
    },

    function () {

        //#region Members

        var _self = this;
		var m_stepDefaults = {
								width           : 500,
								position        : 'rm',
								offsetY         : 0,
								offsetX         : 0,
								fxIn            : '',
								fxOut           : '',
								showStepDelay   : 90,
								center          : 'hook',
								scrollSpeed     : 400,
								scrollEasing    : 'swing',
								scrollDelay     : 0,
								timer           : '00:00',
								highlight       : true,
								keepHighlighted : false,
								keepVisible     : false
							};					

        //#endregion

        //#region Public Methods

        this.OnLoad = function () {

            //Assign Module
            Application.TourManager = this;			
        };

        this.CheckTour = function (viewer) {
            
			if(!Application.CheckOfflineObject("TABL","Xpress Tour Header"))
				return false;
			
			if(!Application.CheckOfflineObject("TABL","Xpress User"))
				return false;
			
			if(!viewer.Page().Name || viewer.Page().Name == "")
				return;	

			if(Application.IsMobileDisplay())
				return;
			
			return $codeblock(
			
				function(){
					FINDSET("Xpress User",{"Username": Application.auth.Username},function(r){						
						return r;
					});
				},
			
				function(user){
					FINDSET("Xpress Tour Header",{"Page Name": viewer.Page().Name},function(r){						
						if(r.Count > 0){
							
							var skiptour = Default(user["Skip Tours"],false);
							if(skiptour){								
								return true;
							}
							
							var id = $id();
							var msg = Default(r["Welcome Message"],"Would you like to take a quick tour of this page?");
							msg += '<br/><br/><input type="checkbox" id="'+id+'">Do not show again</value>'
							FINDSET("Xpress Tour Users",{"Username": Application.auth.Username, "Page Name": viewer.Page().Name},function(usr){
								if(usr.Count == 0 || !usr["Taken Tour"])
									Application.Confirm(msg,function(ret){
										Application.RunNext(function(){
											return $codeblock(
												function(){
													if(usr.Count == 0 && !Application.IsOffline())
														INSERT("Xpress Tour Users",{"Username": Application.auth.Username, "Page Name": viewer.Page().Name});
													if($("#"+id).prop('checked'))
														MODIFY(user,"Skip Tours",true);
													if(ret){
														_self.RunTour(viewer);
													}
												}
											);
										},null,null,true);
									},null,"Begin Tour","No Thanks");
								return true;
							});			
						}else{
							return false;
						}							
					});
				}
			
			);
        };
		
		this.RunTour = function(viewer){
			
			$.powerTour('destroy');
			$('.single-step').remove();
			
			var page = viewer.Page();
			if(!page.Name || page.Name == "")
				return;
			
			var stepsHTML = "";
			var steps = [];
			FINDSET("Xpress Tour Line","SORTING(Sort) WHERE(Page Name=CONST("+page.Name+"))",function(r){
				
				do{
					
					var target = '';
					var pos = Default(r.Pos,'rm');
					if(Application.IsInMobile() && Default(r["Pos Mobile"]," ") != " ")
						pos = r["Pos Mobile"];
					var x = 0;
					var y = 0;
					
					var hdr = "";
					if(r.Heading != null)
						hdr = "<h2>"+r.Heading+"</h2>";
					var tourpos = "";
					if(r.Position+1 == r.Count)
						tourpos = 'tourpos="end"';
					stepsHTML += '<div class="single-step" id="step-id-'+(r.Position+1)+'" '+tourpos+'>';					
					stepsHTML += hdr+'<p>'+r.Content+'</p><br/><br/>';					
					if(r.Position != 0)
						stepsHTML += ' <a href="#" data-powertour-action="prev" style="border: 1px solid Black; padding: 5px; background-color: white; line-height: 30px; color: black;">Prev</a> &nbsp;&nbsp;';
					if(r.Position != r.Count - 1)
						stepsHTML += ' <a href="#" data-powertour-action="next" style="border: 1px solid Black; padding: 5px; background-color: #3276b1; line-height: 30px; color: white;">Next</a> ';					
					//if(r.Position == r.Count - 1)
						stepsHTML += '<a href="#" data-powertour-action="stop" style="float:right; border: 1px solid Black; padding: 5px; background-color: white; line-height: 20px; color: black;">End tour</a>';														
					stepsHTML += '</div>';
					
					if(r.Type == "CUSTOM"){
						
						target = r["Custom ID"];
						
						if(target == "#divSide"){
							if(Application.IsInMobile()){
								target = "#divSideMenu";
								$("#divSideMenu").panel("open");
							}else{
								Application.App.ToggleMainMenu(true);
							}
						}							
						
					}else if(r.Type == "TAB"){
						
						if(r["Tab Name"] == "General"){
							
							target = "#"+viewer.ID();
							
							if(viewer.State() == 1)
								viewer.ToggleState();
								
						}else{
							
							var tb = viewer.GetTabByName(DecodeHTML(r["Tab Name"]));
							if(tb){
								
								target = "#"+tb.ID();
								
								if(tb.State() == 1)
									tb.ToggleState();								
							}
						}
						
					}else if(r.Type == "ACTION"){
												
						var btn = viewer.Button(DecodeHTML(r["Action Name"]));
						if(btn){
							target = "#"+btn.attr("id");					
						}
						
					}else if(r.Type == "FIELD"){
						
						var cont = viewer.Control(DecodeHTML(r["Field Name"]));
						if(cont){
							target = "#"+cont.ID();					
						}else{
							var grd = viewer.GetPageGrid();
							if(grd){
								target = "#"+grd.ID()+"table_"+DecodeHTML(r["Field Name"]);
							}							
						}
					}
								
					var skip = false;
					var w = Default(r.Width,500);
					if(Application.IsInMobile() && r.Type == "TAB" && (pos == "bl" || pos == "bm" || pos == "br"))
						w = UI.Width()-10;
					
					var extra = 0;
					
					if(target != ''){
						
						var e = $(target);										
						
						if(Application.IsInMobile() && e.parent().attr("id") == "AppSideWorkspace"){
							extra = e.offset().top;
							target = "#divFactbox";
							e = $(target);
						}						
						
						if(target != "#divSideMenu" && target != "#divFactbox"){
							e.css("position","relative");	
						}else{
							e.css("position","inherit");
						}
						
						if(e.length == 0){
							target = "";
							skip = true;
						}					
						
						if(!skip){																			
							
							if(pos == "bl"){
								pos = "stl";
								y = (e.offset().top+e.height()+10)*-1;
								x = (e.offset().left - 20) * -1;								
							}
							if(pos == "bm"){
								pos = "stl";								
								y = (e.offset().top+e.height()+10)*-1;
								x = (e.offset().left + (e.width()/2) - (w/2)) * -1;								
							}
							if(pos == "br"){
								pos = "stl";								
								y = (e.offset().top+e.height()+10)*-1;
								x = (e.offset().left + w + e.width()) * -1;								
							}													
							if(pos == "lt"){
								pos = "stl";
								y = (e.offset().top - 10)*-1;
								x = (e.offset().left - (w + 40)) * -1;
							}
							if(pos == "tm"){
								pos = "stl";								
								y = (e.offset().top-500-10)*-1;
								x = (e.offset().left + (e.width()/2) - (w/2)) * -1;								
							}
							if(pos == "rt"){
								pos = "stl";
								y = (e.offset().top - 10)*-1;
								x = (e.offset().left + (e.width()) + 20) * -1;
							}							
							
							y -= extra;
							if(target == "#divSideMenu")
								x -= 272;
							if(target == "#divFactbox")
								x += 272;
						}
						
						e.attr("pos",pos)
					}
					
					if(target == "")
						pos = "sc";									
					if (r.Type != 'PLAIN' && target == "")
					    skip = true;
					
					if(!skip)
					steps.push({
						hookTo: target,
						content: '#step-id-'+(r.Position+1),
						position: pos,
						width: w,
						offsetY: y,
						offsetX: x,							
						onShowStep: function(t) {
							
							if(Application.IsInMobile()){									
								$("#divFactbox").panel("close");
							}
							
							//Get the target and step elements.
							var target = $(".powertour-highlight");
							var step = $(t.currentStep);																	
												
							if(target.length > 0 && target.is(':visible') == false){
								if(target.attr("class").indexOf("mnugrp") != -1)
									target.prev().trigger('click');												
								if(target.attr("class").indexOf("mnu-") != -1)
									target.parent().prev().trigger('click');												
							}
							
							setTimeout(function(){
								try{																					
												
									//Toggle the side menu.
									if(Application.IsInMobile() && target.attr("id") == "divFactbox"){										
										$("#divFactbox").panel("open");
									}																																						
									
									//Check if step is out of bounds.
									var left = step.offset().left;
									if(left+500>$(window).width())
										step.width(UI.Width()-left-20);
									if(left <= 0){
										step.width(UI.Width()-target.offset().left-10);
										step.css("left",5);																					
									}
									
									//Adjust offset.
									var offset = 100;
									if(Application.IsInMobile())
										offset = 5;
									
									//Get the top of the step and target.
									var top = step.offset().top - offset;
									var top2 = 999999999;
									if(target.length > 0)
										top2 = target.offset().top - offset;
									if(top < 0)
										top = 0;									
									if(top2 < 0)
										top2 = 0;	
									
									if(target.length > 0 && step.offset().top < (target.offset().top-50) && Default(target.attr("pos"),"sc") != "sc")
										step.css("top",target.offset().top-step.height()-10);

									//Scroll to the top of the target/step.
									if(Default(target.attr("pos"),"sc") != "sc"){
										var body = $("html, body");
										body.stop().animate({scrollTop:(top < top2 ? top : top2)}, '200');
									}
									
								}catch(e){									
								}		
							},100);								
						}
					});
					
				}while(r.Next());
				
				$('body').append(stepsHTML);
				
				setTimeout(function(){
					
					$.powerTour({
						tours:[
							{
								trigger: '',
								startWith: 1,
								easyCancel: false,
								escKeyCancel: true,
								scrollHorizontal: false,
								keyboardNavigation: true,
								loopTour: false,	
								onEndTour: function(t){																	
									
									var body = $("html, body");
									body.stop().animate({scrollTop:0}, '200');																	
									
									var step = $(t.currentStep);
									if(step.children().first().attr("tourpos")=="end"){
										Application.RunNext(function(){
											INSERT("Xpress Tour Users",{"Username": Application.auth.Username, "Page Name": viewer.Page().Name},function(tu){	
												tu.Record.NewRecord = false;
												MODIFY(tu,"Taken Tour",true,function(){
													Application.Message("You may run this tour again by clicking the ? icon at the top of this page");
												});
											},null,true);
										},null,null,true);
									}else{
										Application.Message("You may run this tour again by clicking the ? icon at the top of this page",null,"Tour Cancelled");
									}
									
									$('.single-step,.powertour-step').remove();
								},
								steps: steps,
								stepDefaults: [m_stepDefaults]
							}
						]
					});
					$.powerTour('run', 1);
			
				},500);
			});			
		};

        //#endregion

		function DecodeHTML(input){
			return $('<div/>').html(input).text();
		};

    });

