#Help File Format

The embedded help format for javascript requires a multiblock comment with a leading '[DOC:' and trailing ']' 

```
/*[DOC:
...
]*/
```

Every module must establish a 'context' - this is the top level 'namespace' under which all generated help files will be placed 
(see the build.json discussion later in this document).

Context is defined by starting a comment line with 'Context:', the following content of the line is the context - so to use a 'context' called util -
use this format:  

```
/*[DOC:
Context: util
]*/
```

The context only needs to be defined once - it gets used throughout the source file for all following comments untill it is overwritten.

Namespace is used for factory objects under a context - the following defines a StringUtil namespace under the util 'context' and provides a description of 'Container for String Utilities'
when generating the page for all the content under util.StringUtil

```
/*[DOC:
Context: util
Namespace: util.StringUtil
Desc: Container for String Utilities
]*/
```

Help

- Context: (top level context)
- Namespace: (namespace - optional )
- Class: (name of class)
- Desc: (Description of namepspace/class/method)
- Syntax: (syntax - used for constructors)
- Method: (method of a class)
- Args: (Arguments section - list arguments for a constructor or method)
- Props: (Properties section - list properties for a class)
- Example: (section of example code)

Props and Args sections have the format

 - propertyname (type:flags) - description


An example of Args section from the audio document - note that Args is on its own line. 

```
/*[DOC:
    Method: A5.audio.Player.load(src)
    Args:
        src (string|array) - The source of the audio file to play, the player will choose the first source it can play if the source is an array.
    Desc: Load an audio file to play.
]*/ 
```

Props Args Desc and Example 'sections' continue until the next tag unless a delimiter is used - a delimiter is comprised of any sequence of 
non-space characters that follow the section heading.

The ability to add delimiters to a section allows content to be nested - A good example of this the audio player class definition.
Notice that the onChange and onBeforeLoad properties have thier own 'arguments' section, and that the 'state' property has 
properties of its own.

```
/*[DOC:
Class: A5.audio.Player
Desc: Audio player class.
Syntax: new A5.audio.Player(settings)
Args:
	settings (object) - Settings for the audio player. This will override the initial values of the properties of the A5.audio.Player class.
Props:
	heartbeat (number:optional) - Rate of heartbeat in seconds, "0" equals no heartbeat, the default in "0.25".
	loop (boolean:optional) - Whether to loop playback.
	onBeforePlay (function():optional) - Event for when playback is initiated, before playing has started. If still buffering "onPlay" will happen after "onLoaded". This event fires for both inital play, and resuming from paused.
	onPlay (function():optional) - Event fired when playback starts. This event fires for both inital play, and resuming from paused.
	onPause (function():optional) - Event fired when playback is paused.
	onChange (function(data):optional) - Event fired when audio player state changes.
		Args: ###
			data (object:readonly) - The data for that change event
				type (string:readonly) - The type of change. "timeupdate" while playing, "buffer" while the audio file is being buffered.
		###
	onBeforeLoad (function(src):optional) -  Event fired before audio is loaded.
		Args: ###
			src (array) - An array of the sources of the audio file to load.
		###
	onLoaded (function():optional) -  Event fired when audio is loaded.
	onDone (function():optional) - Event fired when playback is done, either by reaching the end, or by being stopped by the A5.audio.Player.stop() method.
	state (object:readonly) - The state of the audio player. State is updated by audio events, if you want to refresh "stale" state information use the A5.audio.Player.getState() method.
        Props:###
		loaded (boolean:readonly) - Whether the audio is loaded.
		src (string|boolean:readonly) - The source of the audio.
		stream (boolean:readonly) - Whether the audio is a stream.
		playing (boolean:readonly) - Whether the audio is playing.
		buffer (number:readonly) - Amount buffered, a value between 0.0 and 1.0.
		current (number:readonly) - Current play time of the audio in seconds.
		duration (number:readonly) - Total duration of the audio in seconds.
		volumne (number:readonly) - Current volume, a value between 0.0 and 1.0.
		muted (boolean:readonly) - Whether the audio is muted.
        ###
]*/
```


#Generating Help Pages From Javascript Source

The build.json file in this folder contains the settings for reading comments out of source code.  
The 'javascript' entry is an array of patterns to search, they can be specific filenames, or can 
contain wildcards - for example:

```
{
    "javascript" : [ "/dev/myJsFiles/*.js" ]
    ...
}
```

Would scan all the javascript sources in the '/dev/myJsFiles/' folder.

The context section contains the top level context that will be used to determine where generated pages go.

 
```
{    
    ...
    "context" : {
        "util" : "path" : "/dev/AlphaHelp/helpfiles/Ref/Client_Api/Util", "classname" : "util" , "description" : "Utilities namespace" }
    }
}
```

In then above example, context entry "util" generates files to be nested inside folder '/dev/AlphaHelp/helpfiles/Ref/Client_Api/Util'.
The class and description are used to define the index page for the context.

To rebuild the pages run this:

```
cd \dev\alphaAlphaHelp\buildhelp
node js_helppageGen.js
```

You will then need to do add any new generated content to the git repository, and do a push.  
The buildhelp is not integrated into the build process yet.   
