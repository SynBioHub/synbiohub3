

  export function createHTML(json_stuff) {

    const submit_link = json_stuff.submit_link;

    let html = `<html>\n<body>\n<html>\n<body>\n<form action="${submit_link}" method="POST">`;
    let html_end = `\n<input type="submit" value="Submit">\n\n</form>\n</body>\n</html>`;

    

    const json_dict = json_stuff.interface;



    json_dict.forEach(variable => {
        const defaultVal = variable.default;
        const description = variable.description;
        const label = variable.label;
        const options = variable.options;
        const type = variable.type;
        const restrictions = variable.restrictions;
        const id = label;

        html += `\n<h2>${label}</h2>\n`;
        html += `<p>${description}</p>\n`;

        
        let rest_str = ``;
        if(restrictions.length > 0) {
            restrictions.forEach(val => {
                rest_str += ` ${val}="${restrictions[val]}"`;
            })
        }

        let def_str;
        if(options.length === 0) {
            if(defaultVal.length > 0) {
                def_str = ` value="${defaultVal[0]}"`;
            }
            else {
                def_str = ``;
            }

        html += `<input type="${type}" id="${id}" name="${id}"${def_str}${rest_str}><br><br>\n`;
        }
        else {
            options.forEach(val => {
                if(defaultVal.includes(val)) {
                    def_str = ` checked="checked"`;
                }
                else {
                    def_str = ``;
                }
                html += `<input type="${type}" id="${val}" value="${val}" name="${id}"${def_str}>\n`;
                html += `<label for="${val}">${val}</label><br>\n`;
            })
        }

        
    })
    
    
    html += html_end;

    return html;

  }