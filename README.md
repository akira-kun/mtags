# mtags

<h3>template html file</h3>

```html
[select] {{
  <label for="[name]">[label]</label>
  <select name="[name]">
  [elements:option|blank|hr]
  [option] {{ <option value="[value]" [attribute] {{ [name]="[value]" }}>[label]</option> }}
  [blank] {{ <option></option> }}
  [hr] {{ <option>---</option> }}
  </select>
```

<h3>json model</h3>

<code><pre>{"select": {
       "label": "titulo do select",
       "name": "select1",
       "elements": [
          "blank": "",
          "option": {
               "value"="1"
               "label"="item 1"
               "attribute": [
                   {"name": "value", value="1"}
                   {"name": "class", value="cssClassName"}
               ]
          },
          "hr": "",
          "option": {
               "value"="2"
               "label"="item 2"
               "attribute": [
                   {"name": "value", value="1"}
                   {"name": "class", value="cssClassName"}
               ]
          }
       ]
   }
}</pre></code>
