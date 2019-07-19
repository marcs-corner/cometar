import { Component, OnInit } from '@angular/core';
import { parseString } from 'xml2js';
import { combineLatest, Subject } from 'rxjs';
import { ClientConfigurationService, IClientConfiguration, Mapping } from '../services/client-configuration.service';
import { ConceptByNotationService } from '../services/queries/concept-by-notation.service';
import { map } from 'rxjs/operators';
import { ConceptInformation } from 'src/app/core/concept-information/concept-information.component';
import { HttpClient,HttpHeaders } from '@angular/common/http';
import { ComponentStateService } from 'src/app/services/component-state.service';
import { NavigationTextPart } from 'src/app/core/text-with-navigation/text-with-navigation.component';

@Component({
  selector: 'app-upload-client-configuration',
  templateUrl: './upload-client-configuration.component.html',
  styleUrls: ['./upload-client-configuration.component.css']
})
export class UploadClientConfigurationComponent implements OnInit {
	public inputtype="xml";
	public csc_content="";
  	public xmlFileContent="";
	public feedback:Array<Array<string|NavigationTextPart|NavigationTextPart[]>>=[];
	public warnings_occured=false;
	public replacedFileContent="";
	public csc_new_content="";
	public version_date:Date;
	private version_date_string:string;
	public showUpdatedConfigurationFileDownloadButton=false;

	constructor(
		private clientConfigurationService:ClientConfigurationService,
		private conceptByNotationService:ConceptByNotationService,
		private http:HttpClient,
		private componentStateService:ComponentStateService
	) { }

  ngOnInit() {
	  let state = this.componentStateService.getState("client-configuration");
	  if (state){
		  this.inputtype=state.inputtype;
		  this.csc_content=state.csc_content;
		  this.xmlFileContent=state.xmlFileContent;
		  this.feedback=state.feedback;
		  this.warnings_occured=state.warnings_occured;
		  this.replacedFileContent=state.replacedFileContent;
		  this.csc_new_content=state.csc_new_content;
		  this.version_date=state.version_date;
		  this.version_date_string=state.version_date_string;
		  this.showUpdatedConfigurationFileDownloadButton=state.showUpdatedConfigurationFileDownloadButton
	  }
  }

  ngOnDestroy(){
	this.componentStateService.saveState("client-configuration",{
		inputtype:this.inputtype,
		csc_content:this.csc_content,
		xmlFileContent:this.xmlFileContent,
		feedback:this.feedback,
		warnings_occured:this.warnings_occured,
		replacedFileContent:this.replacedFileContent,
		csc_new_content:this.csc_new_content,
		version_date:this.version_date,
		version_date_string:this.version_date_string,
		showUpdatedConfigurationFileDownloadButton:this.showUpdatedConfigurationFileDownloadButton
	})
  }

  public inputFileSelected(fileInput: any){
    var dateien = fileInput.target.files;
    for (var i = 0, f; f = dateien[i]; i++) {
      if (!f.type.match('text/plain') && !f.type.match('text/xml')) {
        continue;
      }
      var reader = new FileReader();
      reader.onload = ((theFile) => {
        return ((e) => {
          this.xmlFileContent = e.target.result;
        });
      })(f);
      reader.readAsText(f, "UTF-8");
    }
  }

  public loadExample(){
	const _headers = new HttpHeaders();
    const headers = _headers.set('Content-Type', 'text/xml')
	let exampleConfiguration = this.http.get('assets/data/datasource.xml',{headers: _headers,responseType: 'text'});
	exampleConfiguration.subscribe(data => this.xmlFileContent = data);
  }

  public navigateTo(iri:string){
	console.log(iri);
  }

  public analyze(){
		this.replacedFileContent = this.xmlFileContent;
		this.csc_new_content = this.csc_content;
		this.showUpdatedConfigurationFileDownloadButton = false;
		let replacements=[];
		this.feedback = [];
		this.version_date=undefined;
		let mappings:Mapping[] = [];
		if (this.inputtype=="xml") parseString( this.xmlFileContent, ((err, result:IClientConfiguration) => {
			if (result.datasource.meta[0]["version-date"]) {
				this.version_date_string=result.datasource.meta[0]["version-date"];
				this.version_date=new Date(this.version_date_string);
			}
			else {
				this.feedback.push(["","",'Please add a version date to your configuration file.']);
				return;
			}
			mappings = this.clientConfigurationService.getMappings(result);
		}));
		else mappings = this.csc_content.split(",").map(code => {
			return <Mapping>{
				concept: code,
			}
		});
		combineLatest(mappings.map(m=>{
			return this.conceptByNotationService.get(m.concept,this.version_date).pipe(
				map(result => {
					if (!result.concept && m.concept != "") {
						this.feedback.push([{text: m.concept},{text:"Code is unknown."},{text:""}]);
						return undefined;
					}
					if (result.newnotation) {
						this.feedback.push([
							m.concept,
							[
								{text:"Code is deprecated since "+result.removedate.value.toLocaleDateString()+". New code: "},
								{text:result.newnotation.value,navigationtype:"tree",navigationlink:result.concept.value}
							],
							result.new_concept_with_code?[
								{text:"Another concept now has the same code: "},
								{text:result.new_concept_label.value,navigationtype:"tree",navigationlink:result.new_concept_with_code.value }
							]:""
						]);
						if (result.new_concept_with_code) this.warnings_occured=true;
						replacements.push([m.concept, result.newnotation.value]);
					}
					let ci:ConceptInformation
					if (this.inputtype=="xml") ci = {
						concept: result.concept && result.concept.value,
						headings:["Source", "Value", "Mapped Value", "Unit"],
						cellWidthPercentages:[55,15,15,15],
						cellMinWidth:[150,150,150,50],
						cellMaxWidth:[250,150,150,50],
						cells:this.clientConfigurationService.getTreeLines(m),
						sourceId:"clientconfig"
					}
					else ci = {
						concept: result.concept && result.concept.value,
						headings:["Code", "New Code"],
						cells:[[m.concept, result.newnotation && result.newnotation.value]],
						cellWidthPercentages:[50,50],
						sourceId:"clientconfig"
					}
					return ci;
				})
			)
		})).subscribe(data => {
			data = data.filter(d => d != undefined);
			if (data.length == 0) return;
			this.clientConfigurationService.setTreeData(data);
			for (let replacement of replacements){
				if (this.inputtype=="xml") {
					let regex = new RegExp("\""+replacement[0]+"\"", "g");
					this.replacedFileContent = this.replacedFileContent.replace(regex, "\"" + replacement[1] + "\"");
				}
				else {
					let regex = new RegExp("(^|,)"+replacement[0]+"(,|$)", "g");
					this.csc_new_content = this.csc_new_content.replace(regex, "$1" + replacement[1] + "$2");
				}
			}
			let now = new Date(Date.now());
			let nowstring = now.getFullYear()+"-"+(now.getMonth()+1)+"-"+now.getDate();
			let regex = new RegExp("<version-date>"+this.version_date_string+"</version-date>", "g");
			this.replacedFileContent = this.replacedFileContent.replace(regex, "<version-date>"+nowstring+"</version-date>");
			this.showUpdatedConfigurationFileDownloadButton = replacements.length > 0;
		});
  }

  public downloadNewFile(){		
	var a = <HTMLElement>document.createElement("a");
	let thefile = new Blob([this.replacedFileContent], { type: "application/octet-stream" });
	let url = window.URL.createObjectURL(thefile);
	a.setAttribute("href", url);
	a.setAttribute("download", "datasource.xml");
	a.setAttribute("style","display:none");
	document.body.appendChild(a);
	a.click()
	window.URL.revokeObjectURL(url);
	a.remove();  
  }
}