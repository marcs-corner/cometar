$(document).on("modulemanager:readyForModuleRegister", function(){
	ModuleManager.register([
		{
			tabName: "details",
			handlerFunction: function(conceptUrl){
				var resultDiv = $("<div>");

				var treePathDiv = $("<div class='treePathDiv'>");	
				Helper.getPathsByConceptUrl(conceptUrl, function(path){putPath(treePathDiv, path)});			
				resultDiv.append("<h3>path</h3>");
				resultDiv.append(treePathDiv);
				
				for (var i in itemsToShow)
				{
					var itemToShow = itemsToShow[i];
					var itemDiv = $("<div id='info"+itemToShow+"'>");
					resultDiv.append(itemDiv);
				}			
				var queryString = QueryManager.queries.getConceptInfos.replace(/CONCEPT/g, conceptUrl);
				QueryManager.query(queryString, function(resultItem){
					putInfo(resultDiv, resultItem);
				});
				
				var modifierHeading = $("<h3>modifier</h3>");
				var modifierDiv = $("<div class='treePathDiv' id='modifierInfoDiv'>");				
				var queryString = QueryManager.queries.getAllModifiers.replace(/PARENTCONCEPT/g, conceptUrl);
				QueryManager.query(queryString, 
					function(resultItem){
						if (resultDiv.children("#modifierInfoDiv").length == 0)
						{
							resultDiv.append(modifierHeading);	
							resultDiv.append(modifierDiv);							
						}
						Helper.getPathsByConceptUrl(resultItem["subconcept"].value, function(path){putPath(modifierDiv, path)});
					},
					function(){
					}
				);
				
				return resultDiv;
			}
		}
	]);	

	var itemsToShow = [ "label", "notation", "description", "unit", "altlabel" ];

	var putInfo = function(resultDiv, resultItem)
	{
		for (var i in itemsToShow)
		{
			var itemToShow = itemsToShow[i];
			if (resultItem[itemToShow]) 
			{
				if (resultDiv.html().indexOf("<h3>"+itemToShow+"</h3>") == -1)
					resultDiv.children("#info"+itemToShow).before("<h3>"+itemToShow+"</h3>");	
				if (itemToShow == "label") 
					appendInfo(resultDiv.children("#info"+itemToShow), resultItem["lang"].value.toUpperCase() + ": " + resultItem["label"].value);
				if (itemToShow == "altlabel") 
					appendInfo(resultDiv.children("#info"+itemToShow), resultItem["altlang"].value.toUpperCase() + ": " + resultItem["altlabel"].value);
				else appendInfo(resultDiv.children("#info"+itemToShow), resultItem[itemToShow].value);
			}
		}
	}

	var appendInfo = function(div, value)
	{
		if (div.html().indexOf(value) == -1)
		{
			if (div.html() == "") div.html(value);
			else div.html(div.html() + "<br/>" + value);		
		}
	}

	var putPath = function(div, path)
	{
		var headPathDiv = $("<div class='headPathDiv'>");
		headPathDiv.html(path[1].join(" / "));
		headPathDiv.data("path", path[0]);
		headPathDiv.click(function(){
			TreeManager.openPath($.merge([],$(this).data("path")), true);
		});
		//"insertion sorting"
		var pathCount = div.children(".headPathDiv").length;
		for (var i = 0; i < pathCount; i++)
		{
			existingHPD = div.children(".headPathDiv")[i];
			if (headPathDiv.html() < $(existingHPD).html())
			{
				$(existingHPD).before(headPathDiv);
				return;
			}
		}
		div.append(headPathDiv);
	}
});