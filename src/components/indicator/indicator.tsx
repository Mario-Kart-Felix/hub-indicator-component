import { Component, Prop, State, Element} from '@stencil/core';
import { queryFeatures } from '@esri/arcgis-rest-feature-service';
import { request } from '@esri/arcgis-rest-request';

// interface IResourceObject {
//   id: string;
//   attributes: {
//     [key: string]: any;
//   };
// }


@Component({
  tag: 'hub-indicator',
  styleUrl: 'indicator.css',
  shadow: true
})
export class Indicator {
  urlInput: HTMLInputElement;

  @Element() el: HTMLElement; // This Component
  @Prop({ mutable: true }) url: string = "";
  @Prop() schema: string;
  @State() attributes: any = {attributes: []};
  @State() metrics: any = [];
  @State() fields: any = [];

  // Component Methods
  constructor() {

  }

  getData(query): any {
    let url = this.url;
    let params = {url, ...query};

    return queryFeatures(params)
  }

  metricType(measures): JSX.Element {
    let now = new Date();
    let oneYr = new Date();
    oneYr.setFullYear(now.getFullYear() - 1);
    let queryDate = oneYr.getFullYear() + "-" + oneYr.getMonth() + "-" + oneYr.getDay();
    console.log("Metrics", this.metrics)
    switch(measures.type) {
      case "datetime": {

        return this.getData({where: `${measures.name}>DATE '${queryDate}'`, returnCountOnly: true}).then(result => {
          console.log("result", result); // array of features
          this.metrics = [
            ...this.metrics,
            {"id": measures.name, "name": `Time series ${measures.name}`, "value": `There were ${result.count} instances this year.`}
          ];
        });
      }
      case "category": {
        let query = {
          orderByFields: "EXPR_1 DESC",
          groupByFieldsForStatistics: measures.name,
          outStatistics: [{ "statisticType": "count", "onStatisticField": measures.name, "outStatisticFieldName": "EXPR_1" }]
        }
        return this.getData(query).then(result => {
          console.log("result", result); // array of features

          let enumeration = "<ul>";
          for(let f in result.features) {
            enumeration += `<li>${result.features[f].attributes[measures.name]}: ${result.features[f].attributes['EXPR_1']}</li>`;
          }
          enumeration += "</ul>"
          this.metrics = [
            ...this.metrics,
            {"id": measures.name, "name": `Category ${measures.name}`, "value": enumeration}
          ]
        });
      }
      case "value": {
        let query = {
          outStatistics: [{ "statisticType": "sum", "onStatisticField": measures.name, "outStatisticFieldName": "EXPR_1" }]
        }
        return this.getData(query).then(result => {
          console.log("result value", result); // array of features
          this.metrics = [
            ...this.metrics,
            {"id": measures.name, "name": `Time series ${measures.name}`, "value": `There were ${result.features[0].attributes['EXPR_1']} instances this year.`}
          ]
        });
      }
    }
  }

  componentWillLoad() {
    // this.metrics = [];
    if(this.schema !== undefined && this.schema !== null) {
      this.attributes = JSON.parse(this.schema);
      console.log("attributes", this.attributes);
      for(let attribute in this.attributes.attributes) {
        console.log("attr", this.attributes.attributes[attribute])
        this.metricType(this.attributes.attributes[attribute]);
      }
    }
  }

  handleChange(event) {
    this.fields = [];
    this.metrics = [];
    this.url = this.urlInput.value;
    console.log("handleChange", event)
    request(this.url).then(response => {
      console.log(response) // WebMap JSON
      this.fields = response.fields;
    });
  }
  handleSelect(event) {
    console.log(event.target);
    let setting = {"name": event.target.id, "type": event.target.value};

    console.log("Setting", setting);
    this.attributes.attributes.push(setting)
    this.metricType(setting);
    // this.selectValue = event.target.value;
  }

  render() {
    return ([
      <form id="indicator-configuration">
        <h3>Configure Indicator</h3>
        <h4>Dataset URL</h4>
        <input type="text" value={this.url} onChange={(event) => this.handleChange(event)} ref={(el: HTMLInputElement) => this.urlInput = el} />
        <h4>Indicator Attributes</h4>
        {this.fields.map((field) =>
          <div class="indicator-setting">
            <label>{field.name}</label>
            <select onInput={(event) => this.handleSelect(event)} id={field.name} name="type">
              <option value="none">None</option>
              <option value="value">Value</option>
              <option value="category">Category</option>
              <option value="datetime">Date/Time</option>
            </select>
             <small>{field.type}</small>
          </div>
        )}
      </form>,
      <div id="indicator-metrics">
        {this.metrics.map((metric) =>
          <div>
            {/* <div id={`chart-${metric.id}`} class="chart"></div> */}
            <div>{metric.name}</div>
            <div innerHTML={metric.value}></div>
          </div>
        )}
      </div>
    ]
    )

  }
}
