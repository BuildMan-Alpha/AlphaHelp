#Editing Help Files

An XML Markup is supported, and described here [Using the Documentation XML](Using the Documentation XML.HTM).

#Moving images

In the /dev/AlphaHelp/helpserver folder there is a utility called fixupimageref.js that generates a 
windows .BAT file to copy/move images when pages have been moved from a parent 'staging' folder into 
a child level folder.

Below is an example of running the command on a parent level folder called '/dev/AlphaHelp/helpfiles/foo'
that contains a file that references in an image that was moved to a child folder called C:\dev\AlphaHelp\helpfiles\foo\kid2
The code generates windows BAT commands to create the require child folder and move the required image.  

```
C:\dev\AlphaHelp\helpserver>node fixupimageref.js /dev/AlphaHelp/helpfiles/foo
MD "C:\dev\AlphaHelp\helpfiles\foo\kid2\images"
MOVE "C:\dev\AlphaHelp\helpfiles\foo\images\UG_Fix_CHM_Help.gif" "C:\dev\AlphaHelp\helpfiles\foo\kid2\images\UG_Fix_CHM_Help.gif"
```

When you are satified with the validatity of the script generated, pipe it to a BAT file and run in.

```
C:\dev\AlphaHelp\helpserver>node fixupimageref.js /dev/AlphaHelp/helpfiles/foo >movethem.bat
C:\dev\AlphaHelp\helpserver>movethem.bat
```
