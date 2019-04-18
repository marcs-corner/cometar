import { Injectable } from '@angular/core';
import { DataService, JSONResponsePartUriString, JSONResponsePartLangString, JSONResponsePartBoolean, JSONResponsePartString, prefixes, JSONResponsePartNumber, JSONResponsePartDate } from '../services/data.service';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { TreeIconsQueryService } from './services/queries/tree-icons-query.service';
import { TreeStyleService, TreeItemStyle } from '../core/services/tree-style.service';
import { MatIconRegistry } from '@angular/material';
import { DomSanitizer } from '@angular/platform-browser';

@Injectable({
  providedIn: 'root'
})
export class ElementDetailsService {
  constructor(
    private statusqueryService:TreeIconsQueryService,
    private treeStyleService:TreeStyleService,
    iconRegistry: MatIconRegistry, 
    sanitizer: DomSanitizer
  ){
    iconRegistry.addSvgIcon('draft', sanitizer.bypassSecurityTrustResourceUrl('assets/img/icons/baseline-grade-24px.svg'));
    //iconRegistry.addSvgIcon('draft', sanitizer.bypassSecurityTrustResourceUrl('assets/img/icons/baseline-add_circle-24px.svg'));
    //iconRegistry.addSvgIcon('draft', sanitizer.bypassSecurityTrustResourceUrl('assets/img/icons/baseline-playlist_add_check-24px.svg'));
    iconRegistry.addSvgIcon('editNote', sanitizer.bypassSecurityTrustResourceUrl('assets/img/icons/baseline-find_in_page-24px.svg'));
  }

  public loadStatusIcons(){    
    this.treeStyleService.addTreeItemStyles(this.statusqueryService.get().pipe(map(data => {
      let treeItemStyles:TreeItemStyle[] = data.map(ti => {
        let style = this.treeStyleService.getEmptyStyle(ti.element.value);
        if (ti.draft && ti.draft.value) {
          style.icons.push({
            type: "imgIcon",
            "background-color": "white",
            "iconName": "draft",
            id: "draft",
            "bubble-up": {
              type: "smallImgIcon",
              "iconName": "draft",
              "background-color": "white",
              id: "draft_bubble",
              color: "var(--dzl-blue)"
            }
          });
        }
        if (ti.editnotes && ti.editnotes.value > 0) {
          style.icons.push({
            type: "imgIcon",
            "background-color": "white",
            "iconName": "editNote",
            id: "editNote",
            "bubble-up": {
              type: "smallImgIcon",
              "iconName": "editNote",
              "background-color": "white",
              id: "editNote_bubble",
              color: "var(--dzl-blue)"
            }
          });
        }
        return style;
      });
      return treeItemStyles;
    })));
  }
}