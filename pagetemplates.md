# Building templates into pages

Open functions_v11 project, and run the __generateAddinsAutoHelp to expand all the defined templates - once templates
and embedded comments are added, the script can be re-run to update the help pages in the event new properties are
added.

# Defining Templates

The page templates are stored in the \dev\AlphaHelp\PageTemplate  folder.  The page template name
matches the 'helpcontext' name stored in the json map '\dev\AlphaHelp\contexthelp.json'.

The page templates contain references to html 'parts' extracted from the xbasic addins UI code. 

The placeholders for comment TOC: and Content: are expanded to the embedded TOC section or body.

Given the generated part 'myTopic' - extracting TOC into the template is expressed using this placeholder:

```
<!--TOC:myTopic--->
```

Expanding the 'content'  of the page into the template is done with this placeholder:

```
<!--Content:myTopic--->
```

# Extracting 'parts' from Xbasic UI

The comment in the xbasic code precedes property grid definitions only at this time. The tag in the xbasic code 
starts with 'AUTOHELP:propgrid=' and is followed by the page name and suffix (the suffix is required so that an
xdialog that multiple grids can have multiple generated sections) - the suffix portion is the 'myTopic' discussed in
defining templates section.


example from a5_WebProjPropertiesBuilder() function

'AUTOHELP:propgrid=webprojectpropertiesbuilder.Design_Time

The template file called 'webprojectpropertiesbuilder.html' in the \dev\AlphaHelp\PageTemplate  folder.

```
<html>
<body>
<div class="helpserver_toc">
<ul>
<li><a href="#Run_Time">Run Time Properties</a>
<!--TOC:Run_Time--->	
</li>
<li><a href="#Design_Time">Design Time Properties</a>
<!--TOC:Design_Time--->	
</li>
</ul>
</div>
<h1><a id="Run_Time">Run Time Properties<a></h1>
<!--Content:Run_Time--->	
<h1><a id="Design_Time">Design Time Properties<a></h1>
<!--Content:Design_Time--->	
<!---HELPMETADATA: {"tags":"web","status":"accept"} --->
</body>	
</html>	
```

# Adding Context Help

Once the property grid is defined,  add the {help=} tag to enable F1 context-sensitive help for any property grid.
In the case of the 'webprojectpropertiesbuilder' example, the two sections are the 'Run Time Properties' before the 
time properties panel, and the 'Design Time Properties' section.

The help directive needs to start with a '#' , and end with a '\*', ommitting the trailing '\*' will mean that F1
will take the user to the top if that help section, not the item.

```
{help=#webprojectpropertiesbuilder||Run Time Properties*}
{propgrid=150,30pg};
```

```
{help=#webprojectpropertiesbuilder||Design Time Properties*}
{propgrid=150,30pgDT};
```

# TBD

Still on the todo list for me

1. Add annotation support - allows extra markup to be added to the generated content, this might be example code, screen shots, or just more detailed instructions. 
2. Integrate with git - right now when a new generated page is added, it needs to be manually added to git, this could be automated.

