/*
 * requirejs-templates
 * https://github.com/sergiovilar/grunt-requirejs-templates
 *
 * Copyright (c) 2013 Sérgio Vilar
 * Licensed under the MIT license.
 */

/*jshint evil:true */

'use strict';

module.exports = function(grunt) {

  var fs = require('fs');
  var file = require('file');
  var mkdirp = require('mkdirp');

  function extractPath(string){

    var quotes;
    if(string.indexOf("'") > -1){
      quotes = "'";
    }else if(string.indexOf('"') > -1){
      quotes = '"';
    } 
    var arr = string.split(quotes);
    return arr[1];

  }

  function removeBracketsAndQuotes(string){

    var regex = new RegExp('"', 'g');

    string = string.replace("[","");
    string = string.replace("]","");
    string = string.replace(regex,"");
    string = string.replace(/\\n/g,"");   
    string = string.replace(/\\r/g,"");
    string = string.replace(/\\t/g,""); 

    string = string.trim();

    return string;

  }

  Object.merge = function (o1, o2) { // Function to merge all of the properties from one object into another
      for(var i in o2) { o1[i] = o2[i]; }
      return o1;
  };

  grunt.registerMultiTask('requirejs_templates', 'A plugin to insert the content of template files like underscore, handlebars to variables into the javascript code', function() {

    try{

      var defaults = {
        appDir: ".",
        scripts: "scripts",
        templates: "templates"
      };

      var options = Object.merge(defaults, this.data.options);      
  
      // Lê os arquivos 
      file.walkSync(options.appDir + '/' + options.scripts, function(path, dirPath, dirs, files){   

        for(var u in dirs){
          
          var data = fs.readFileSync(process.cwd() + '/' + path + '/' + dirs[u], 'utf8');   

          if(data.indexOf('text!' + options.templates) > -1){

            var templates_signature = '';

            var defineHeader_array1 = data.split('define([');
            var defineHeader_array2 = defineHeader_array1[1].split('{');

            var defineHeader = 'define([' + defineHeader_array2[0] + '{';
            var newDefineHeader = defineHeader;

            var templatesList = eval("[" + defineHeader_array2[0].trim().split(']')[0] + "]");            
            
            var variables = defineHeader_array2[0].split(']')[1].split('(')[1].split(')')[0];
            var requires = defineHeader_array2[0].trim().split(']')[0];

            var variablesList = variables.split(', ');
            var _variablesList = variables.split(', ');

            var templates = [];
            var require_files = [];
            var arr = requires.split(',');
            for(var i in arr){
              require_files.push(arr[i]);

              if(arr[i].indexOf('text!') > -1){
                templates.push(arr[i].trim());                
              }
            }

            var templates_counter = 0;

            for(var w in templates){              

				if(templates[w].indexOf('text!' + options.templates) > -1){
					var templateFilePath = extractPath(templates[w]).replace('text!' + options.templates, options.appDir + '/' + options.templates);
				}else{

					var templateFilePath = templates[w].replace('text!', options.appDir + '/').replace(/'/g, '');

				}

              var templateData = fs.readFileSync(process.cwd() + '/' + templateFilePath, 'utf8');
              templateData = templateData.replace(/\n/g, '').replace(/\r/g, '').replace(/\t/g, '').replace(/'/g, '"').trim();

              var index;
              for(var z in templatesList){
                if(templatesList[z] === extractPath(templates[w])){
                  index = z;
                }
              }

              index = index - templates_counter;           

              var templateContent = "\n    var "+variablesList[index] + " = '" + templateData + "';";
              templates_signature += templateContent;   

              variablesList.splice(index, 1);
              require_files.splice(index, 1);                            

              templates_counter++;            

            }

            newDefineHeader = newDefineHeader.replace(requires, removeBracketsAndQuotes(JSON.stringify(require_files)).replace(new RegExp(',', 'g'), ",\n"));
            newDefineHeader = newDefineHeader.replace(variables, removeBracketsAndQuotes(JSON.stringify(variablesList)));
            newDefineHeader += "\n" + templates_signature;

            if(require_files.length < 2){
              newDefineHeader = newDefineHeader.replace("define([\n    ","define([");
            }            
            
            var newFileContent = data.replace(defineHeader, newDefineHeader);   

            if(options.output){
          
              mkdirp.sync(process.cwd() + '/' + options.output + '/' + path);
              fs.writeFileSync(process.cwd() + '/' + options.output + '/' + path + '/' + dirs[u], newFileContent, 'utf8');
              
            }else{
              fs.writeFileSync(process.cwd() + '/' + path + '/' + dirs[u], newFileContent, 'utf8');            
            }                     
                  
          }else{
			  mkdirp.sync(process.cwd() + '/' + options.output + '/' + path);
			  fs.writeFileSync(process.cwd() + '/' + options.output + '/' + path + '/' + dirs[u], data, 'utf8');

		  }

        }      

      });

    }catch(e){
      grunt.log.writeln("Error: "+e.message);
      console.log(e.stack);
    }      

  });

};
