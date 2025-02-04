import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { ProvenanceService } from '../services/provenance.service';
import { Observable, Subject, ReplaySubject, BehaviorSubject, combineLatest } from 'rxjs';
import { ConfigurationService } from 'src/app/services/configuration.service';
import { Router, ActivatedRoute } from '@angular/router';
import { UrlService } from 'src/app/services/url.service';
import { map } from 'rxjs/operators';
import { MatSliderChange } from '@angular/material/slider';

@Component({
	selector: 'app-provenance',
	templateUrl: './provenance.component.html',
	styleUrls: ['./provenance.component.css']
})
export class ProvenanceComponent implements OnInit {
	public fromDate:Date;
	public commitMetaDataByDay=[];
	private defaultProvFromDays=30;
	public demometadata = {
		author:{value:'Author'},
		commitid:{value:'Commit-ID'},
		message:{value:'Commit Message'}
	}
	public categories = {};
	constructor(
		private provenanceService:ProvenanceService,
		public configuration:ConfigurationService,
		private router:Router,
		private urlService:UrlService,
		private route:ActivatedRoute,
		private cd: ChangeDetectorRef
	) { 
		this.displayOptions$=new BehaviorSubject<{}>(this.displayOptions);
		this.provenanceService.setDisplayOptions(this.displayOptions$);
    
		this.route.queryParamMap.pipe(
			map(data => data.get('provenancefrom'))
		).subscribe(date => {
			this.fromDate = date && new Date(date);
			if (!this.fromDate) {
				this.fromDate = new Date(Date.now());
				this.fromDate.setHours(this.fromDate.getHours()-(this.defaultProvFromDays*24));
				this.navigateToFromDate();
			}
		}).unsubscribe();

		this.route.queryParamMap.pipe(
			map(data => data.get('provenancefrom'))
		).subscribe(date => {
			if (!date) return;
			this.fromDate = date && new Date(date) || new Date(Date.now());
			let datediff = Date.now().valueOf()-this.fromDate.valueOf();
			this.historyFromDays = Math.floor(datediff/1000/60/60/24);
			this.commitMetaDataByDay = this.provenanceService.getProvenance(this.fromDate);
		});

		Object.keys(this.configuration.changeCategories).forEach(key => {
			if (this.configuration.changeCategories[key] == undefined) return;
			let value = this.configuration.changeCategories[key];
			this.categories[value]=this.categories[value] || [];
			this.categories[value].push(key)
		});
	}

	ngOnInit() {
		
	}

	public getDemocommitdata(n1:number,n2:number,n3:number){
		let democommitdata = [];
		for (let i = 0; i < n1; i++){
			democommitdata.push({predicate: { value: "http://www.w3.org/2004/02/skos/core#prefLabel"},deprecatedsubject: { value: false }});
		}
		for (let i = 0; i < n3; i++){
			democommitdata.push({predicate: { value: this.configuration.settings.rdf.unit_iri},deprecatedsubject: { value: false }});
		}
		for (let i = 0; i < n2; i++){
			democommitdata.push({predicate: { value: this.configuration.settings.rdf.status_iri},deprecatedsubject: { value: false }});
		}
		return democommitdata;
	}

	public onSelect(commitid:string){
		this.route.queryParamMap.pipe(
			map(data => data.get('commit'))
		).subscribe(commitids => {
			let commitidsarr = commitids && commitids.split(",").filter(c => c != undefined && c != "").map(c => this.urlService.extendRdfPrefix(c)) || [];
			if (!commitidsarr.includes(commitid)) commitidsarr = commitidsarr.concat(commitid);
			else commitidsarr.splice(commitidsarr.indexOf(commitid),1);
			commitidsarr = commitidsarr.map(c => this.urlService.shortenRdfPrefix(c));
			this.router.navigate(["provenance"],{ queryParams: {date: null, commit: commitidsarr.join(","), wholetimespan: null}, queryParamsHandling: "merge" });
		}).unsubscribe();
	}

	public onCommitFinishedLoading(commitid:string){
		this.provenanceService.onCommitFinishedLoading(commitid);
	}

	public isSelectedCommit(commitid:string):Observable<boolean>{
		return this.provenanceService.selectedCommits$.pipe(map(data => data && data.includes(commitid)));
	}

	public onDaySelect(date:Date){
		this.router.navigate(["provenance"],{ queryParams: {commit: null, date: date.getFullYear()+"-"+(date.getMonth()+1)+"-"+date.getDate(), wholetimespan: null}, queryParamsHandling: "merge" });
	}

	public onAllSelect(){
		this.router.navigate(["provenance"],{ queryParams: {commit: null, date: null, wholetimespan: "true"}, queryParamsHandling: "merge" });
	}

	public isSelectedDate(date:Date):Observable<boolean>{
		return this.provenanceService.selectedDateValue$.pipe(
			map(selectedDate => {
				if (selectedDate == null) return false;
				let compareDateValue = new Date(date.getFullYear()+"-"+(date.getMonth()+1)+"-"+date.getDate()).valueOf();
				return compareDateValue == new Date(selectedDate).valueOf()
			})
		);
	}

	public isAllSelected():Observable<boolean>{
		return this.provenanceService.selectedWholeTimespan$.pipe(map(s => s!=null));
	}


	public displayOptionToggle(option:string){
		this.displayOptions[option] = !this.displayOptions[option];
		this.displayOptions$.next(this.displayOptions);
	}

	public isOptionsHeadingChecked(category:string){
		let result = true;
		this.categories[category].forEach(predicate => {
			if (this.displayOptions[predicate] != true) result = false;
		});
		return result;
	}

	public displayOptionsHeadingToggle(category:string){
		let checked = this.isOptionsHeadingChecked(category);
		this.categories[category].forEach(predicate => {
			this.displayOptions[predicate] = !checked
		})
		this.displayOptions$.next(this.displayOptions);
	}

	private displayOptions = this.configuration.initialCheckedPredicates;
	public displayOptions$:BehaviorSubject<{}>;


	
	public historyFromDays:number;
	public performHistoryChange(event:MatSliderChange){
		this.navigateToFromDate();
	}
	private navigateToFromDate(){
		this.router.navigate([],{queryParams: {provenancefrom: this.fromDate.getFullYear() +"-"+ (this.fromDate.getMonth()+1)+"-"+this.fromDate.getDate()}, queryParamsHandling: "merge" });
	}

	public changeHistoryFromLabel(event:MatSliderChange){
		let date = new Date(Date.now());
		date.setHours(date.getHours() - 24*event.value);
		this.fromDate = date;
	}
	public formatLabel(value:number){
		let date = new Date(Date.now());
		date.setHours(date.getHours() - 24*value);
		return date.toLocaleDateString("de-DE", {day: '2-digit', month: '2-digit', year: 'numeric'});
	}
}