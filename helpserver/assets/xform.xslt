<xsl:stylesheet xmlns:xsl="http://www.w3.org/1999/XSL/Transform" version="1.0">
	<xsl:template match="/">
		<xsl:for-each select="page">
           <xsl:choose>
              <xsl:when test="./@class"> <div class="{./@class}"> <xsl:call-template name="page-content"/> </div> </xsl:when>
              <xsl:when test="./@build"> <div class="buildBadge" data-build="{./@build}" > <xsl:call-template name="page-content"/> </div> </xsl:when>
              <xsl:otherwise> <xsl:call-template name="page-content"/> </xsl:otherwise>
           </xsl:choose>
		</xsl:for-each>
	</xsl:template>
	<xsl:template match="pages" name="pages" >
        <xsl:for-each select="pages/page">
			<xsl:call-template name="page-content"/>
		</xsl:for-each>
	</xsl:template>
	<xsl:template match="page-content" name="page-content" >
        <xsl:if test="./@api"><div class="apiLanguage" style="">
        <xsl:choose>
            <xsl:when test="./@api='xb'">Xbasic</xsl:when>
            <xsl:when test="./@api='js'">JavaScript</xsl:when>
            <xsl:when test="./@api='cstemplate'">Client Side Template</xsl:when>
            <xsl:otherwise><xsl:value-of select="./@api" /></xsl:otherwise>
        </xsl:choose>
        </div></xsl:if>
        <xsl:if test="./@reorder-children"><xsl:comment>orderchildren</xsl:comment> </xsl:if>
        <xsl:if test="links">
            <script id="definePageLinks" type="text/xmldata" >
                <xsl:for-each select="links/link">
                    <xsl:choose>
                        <xsl:when test="./@href">
                            <xsl:choose>
                                <xsl:when test="./@target">
                                    <a href="{./@href}" target="{./@target}"><xsl:value-of select="." /></a>
                                </xsl:when>
                                <xsl:otherwise>
                                    <a href="{./@href}"><xsl:value-of select="." /></a>
                                </xsl:otherwise>
                           </xsl:choose>
                        </xsl:when>
                        <xsl:when test="./@link">
                            <xsl:choose>
                                <xsl:when test="./@target">
                                    <a href="((A5_BASE_PATH))index?search={normalize-space(./@link)}" target="{./@target}"><xsl:value-of select="." /></a>
                                </xsl:when>
                                <xsl:otherwise>
                                    <a href="((A5_BASE_PATH))index?search={normalize-space(./@link)}"><xsl:value-of select="." /></a>
                                </xsl:otherwise>
                           </xsl:choose>
                        </xsl:when>
                        <xsl:when test="./@target">
                            <a target="{./@target}"><xsl:value-of select="." /></a>
                        </xsl:when>
                        <xsl:otherwise>
                            <a><xsl:value-of select="." /></a>
                        </xsl:otherwise>
                    </xsl:choose>
                </xsl:for-each>
            </script>
        </xsl:if>
        <xsl:choose> 
           <xsl:when test="./@depth">
                <xsl:if test="topic"><h1><a name="section{(./@depth)-1}_{topic}" ><xsl:value-of select="topic" /></a></h1></xsl:if>
                <xsl:if test="name"> <h1><a name="section{(./@depth)-1}_{name}" ><xsl:value-of select="name" /></a></h1></xsl:if>
           </xsl:when>
           <xsl:when test="topic/@parent">
                <h1><span class="topicContext_{topic/@parentType}" ><xsl:value-of select="topic/@parent"/></span><span class="topicElement"><xsl:value-of select="topic/@elementName" /></span></h1>
           </xsl:when>
           <xsl:when test="topic/@method">
                <h1 class="apiEndpoint"><span class="method_{topic/@method}"><xsl:value-of select="topic/@method" /></span><xsl:if test="topic/@scope"><span class="scopes"><xsl:value-of select="topic/@scope" /></span></xsl:if><xsl:value-of select="topic" /></h1>
           </xsl:when>
           <xsl:otherwise>
                <xsl:if test="topic"><h1><xsl:value-of select="topic" /></h1></xsl:if>
                <xsl:if test="name"> <h1><xsl:value-of select="name" /></h1></xsl:if>
           </xsl:otherwise>
        </xsl:choose>
        <xsl:call-template name="callouts-before"/>
		<xsl:if test="syntax">
			<p class="A5">Syntax</p>
			<div class="syntax"><xsl:value-of select="syntax" /></div>
		</xsl:if>
		<xsl:if test="prototype">
			<p class="A5">Syntax</p>
            <div class="prototype">            
               <xsl:choose>
                    <xsl:when test="prototype/@static">
                        <span class="methodStatic"><xsl:value-of select="prototype" /></span>
                    </xsl:when>
                    <xsl:otherwise>
                        <xsl:value-of select="prototype" />
                    </xsl:otherwise>
               </xsl:choose>
            </div>
		</xsl:if>
		<xsl:if test="prototypes">
			<p class="A5">Syntax</p>
            <div class="prototype">
			<xsl:for-each select="prototypes/prototype">
               <xsl:choose>
                    <xsl:when test="./@static">
                        <p class="methodStatic"><xsl:value-of select="." /></p>
                    </xsl:when>
                    <xsl:otherwise>
                        <p><xsl:value-of select="." /></p>
                    </xsl:otherwise>
               </xsl:choose>			
			</xsl:for-each>
            </div>
		</xsl:if>
		<xsl:if test="arguments">
            <p class="A5">Arguments</p>
			<xsl:call-template name="arguments"/>    
		</xsl:if>
		<xsl:if test="returns">
			<xsl:call-template name="returns-template" />
		</xsl:if>
		<xsl:if test="description">
		    <xsl:choose>
                <xsl:when test="description='here' or description='Here' or description='here...' or description='Here...'">   
                   <p class="A5">Under Construction</p>
                   <p>This section is incomplete.</p>
                   <div class="underConstruction">&#160;</div>
                   <p>We're working on filling in the missing information as quickly as possible. If there's something you'd like to see here, use the "Report an Issue with this Page" link at the bottom of this page to let us know.</p>
                </xsl:when>
                <xsl:otherwise>            
                    <meta name="description" content="{description}"/>
                    <p class="A5">Description</p>
                    <xsl:for-each select="description">
                        <xsl:call-template name="text-content"/>
                    </xsl:for-each>
                </xsl:otherwise>
            </xsl:choose>
		</xsl:if>
		<xsl:choose>
            <xsl:when test="discussion/@include">
                <div class="include-file"><xsl:value-of select="discussion/@include" disable-output-escaping="yes" /></div>
            </xsl:when>
			<xsl:when test="content">
				<p class="A5">Discussion</p>
				<p>
					<xsl:value-of select="content" disable-output-escaping="yes" /> </p>
			</xsl:when>
			<xsl:when test="discussion/@type='html'">
				<p class="A5">Discussion</p>
				<p>
					<xsl:value-of select="discussion" disable-output-escaping="yes" /> </p>
			</xsl:when>
			<xsl:when test="discussion">
				<p class="A5">Discussion</p>
                <xsl:for-each select="discussion">
                    <xsl:call-template name="text-content"/>
                </xsl:for-each>
 			</xsl:when>
		</xsl:choose>
        <xsl:if test="list">
            <xsl:call-template name="list"/>
        </xsl:if>
		<xsl:if test="example">
            <xsl:call-template name="example-template"><xsl:with-param name="default_title">Example</xsl:with-param></xsl:call-template>            
		</xsl:if>
		<xsl:if test="sections">
            <xsl:call-template name="section-content"/>
		</xsl:if>
        <xsl:if test="groups">
			<xsl:for-each select="groups/group">
               <xsl:choose>
                    <xsl:when test="./@background">
                        <div class="pagegroupBackground">
                                <xsl:if test="title">
                                    <h2><a name="group_{title}"><xsl:value-of select="title" /> </a></h2>
                                </xsl:if>
                                <xsl:call-template name="section-content"/>
                        </div>   
                    </xsl:when>    
                    <xsl:otherwise>
                        <div class="pagegroup">
                            <xsl:if test="title">
                                <h2><a name="group_{title}"><xsl:value-of select="title" /> </a></h2>
                            </xsl:if>
                            <xsl:call-template name="section-content"/>
                        </div>   
                    </xsl:otherwise>
               </xsl:choose>  
            </xsl:for-each>        
        </xsl:if>
		<xsl:if test="properties">
			<h2 ><a name="group_properties">Properties</a></h2>
            <dl class="propertiesDL" >
                <xsl:for-each select="properties/property">
                <xsl:call-template name="properties-content"><xsl:with-param name="depth"><xsl:choose><xsl:when test="../../@depth"><xsl:value-of select="../../@depth" /></xsl:when><xsl:otherwise>1</xsl:otherwise></xsl:choose></xsl:with-param></xsl:call-template>
                </xsl:for-each>
            </dl>
		</xsl:if>
		<xsl:if test="methods">
			<h2 ><a name="group_methods">Methods</a></h2>
			<dl class="methodsDL" >
                <xsl:if test="methods/@nomethods"> <dt class="noMethods"><xsl:value-of select="methods" /></dt></xsl:if>
				<xsl:for-each select="methods/method">
				  <xsl:if test="syntax">
                    <xsl:choose>
                    <xsl:when test="./@static">
                        <dt class="methodStatic"><xsl:value-of select="syntax" /></dt>
                    </xsl:when>
                    <xsl:otherwise>
                        <dt><xsl:value-of select="syntax" /></dt>
                    </xsl:otherwise>
                   </xsl:choose>
                   </xsl:if>
				  <xsl:if test="name">
                    <xsl:choose>
                    <xsl:when test="./@static">
                        <dt class="methodStatic"><a name="section_{normalize-space(name)}"><xsl:value-of select="name" /></a></dt>
                    </xsl:when>
                    <xsl:otherwise>                        
                        <dt><a name="section_{normalize-space(name)}"><xsl:value-of select="name" /></a></dt>
                    </xsl:otherwise>
                   </xsl:choose>
                   </xsl:if>
					<dd><xsl:call-template name="callouts-before"/>
                    <xsl:if test="arguments"><xsl:if test="arguments"><xsl:call-template name="arguments"/></xsl:if></xsl:if>
                    <xsl:if test="returns"><xsl:call-template name="returns-template" /></xsl:if>                    						
                        <xsl:for-each select="description">
                            <xsl:call-template name="text-content"/>
                        </xsl:for-each>
						<xsl:if test="example">
                            <xsl:choose>
                            <xsl:when test="example/@include">
                            <b class="A5">Example</b> <pre class="codeSection"><div class="include-file"><xsl:value-of select="example/@include" disable-output-escaping="yes" /></div></pre>
                            </xsl:when>
                            <xsl:otherwise>
							<b class="A5">Example</b> <pre class="codeSection"><xsl:value-of select="example" /></pre>
                            </xsl:otherwise>
                            </xsl:choose>
						</xsl:if>
                        <xsl:if test="ref">
                            <xsl:choose>
                                <xsl:when test="./@href"><a href="{./@href}"><xsl:value-of select="ref" /></a></xsl:when>
                                <xsl:otherwise><a href="javascript:helpServer.navigateClosestTopic('{normalize-space(ref)}')"><xsl:value-of select="ref" /></a></xsl:otherwise>
                            </xsl:choose>
                        </xsl:if>
                        <xsl:call-template name="callouts-after"/>
					</dd>
				</xsl:for-each>
				<xsl:for-each select="methods/methodref">
                    <xsl:if test="name">
                        <xsl:choose>
                            <xsl:when test="./@static">
                            <xsl:choose>                            
                            <xsl:when test="ref/@href"><dt class="methodStatic"><a href="{ref/@href}" name="section_{normalize-space(name)}"><xsl:value-of select="name" /></a></dt></xsl:when>
                            <xsl:when test="ref/@link"><dt class="methodStatic"><a href="((A5_BASE_PATH))index?search={ref/@link}" name="section_{normalize-space(name)}"><xsl:value-of select="name" /></a></dt></xsl:when>
                            <xsl:when test="ref"><dt class="methodStatic"><a href="((A5_BASE_PATH))index?search={ref}" name="section_{normalize-space(name)}"><xsl:value-of select="name" /></a></dt></xsl:when>
                            <xsl:otherwise><dt class="methodStatic"><a href="javascript:helpServer.navigateClosestTopic('{normalize-space(name)}')" name="section_{normalize-space(name)}"><xsl:value-of select="name" /></a></dt></xsl:otherwise>
                            </xsl:choose>
                            </xsl:when>
                            <xsl:otherwise>
                            <xsl:choose>
                            <xsl:when test="ref/@href"><dt><a href="{ref/@href}" name="section_{normalize-space(name)}"><xsl:value-of select="name" /></a></dt></xsl:when>
                            <xsl:when test="ref/@link"><dt><a href="((A5_BASE_PATH))index?search={ref/@link}" name="section_{normalize-space(name)}"><xsl:value-of select="name" /></a></dt></xsl:when>
                            <xsl:when test="ref"><dt><a href="((A5_BASE_PATH))index?search={ref}" name="section_{normalize-space(name)}"><xsl:value-of select="name" /></a></dt></xsl:when>                            
                            <xsl:otherwise><dt><a href="javascript:helpServer.navigateClosestTopic('{normalize-space(name)}')" name="section_{normalize-space(name)}"><xsl:value-of select="name" /></a></dt></xsl:otherwise>
                            </xsl:choose>
                            </xsl:otherwise>
                        </xsl:choose>                                            
                        <dd><xsl:call-template name="callouts-before"/><xsl:for-each select="description"><xsl:call-template name="text-content"/></xsl:for-each><xsl:call-template name="callouts-after"/></dd>
                    </xsl:if>    
				</xsl:for-each>
			</dl>
		</xsl:if>
		<xsl:if test="classes">
			<xsl:for-each select="classes/class">
				<xsl:call-template name="page-content"/>
			</xsl:for-each>
		</xsl:if>       
        <xsl:call-template name="callouts-after"/>
        <xsl:if test="pages">
            <xsl:call-template name="pages"/>
        </xsl:if>        
		<xsl:if test="video">
			<xsl:for-each select="video">
                <xsl:choose>
                    <xsl:when test="./@embedded"> <div class="videoPlayer"><iframe src="{normalize-space(.)}"  class="embeddedVideo" frameborder="0" allowfullscreen="true">loading...</iframe></div> </xsl:when>
                    <xsl:otherwise>
                        <li>
                            <a xsl:use-attribute-sets="href-link">
                                <xsl:choose>
                                    <xsl:when test="name">
                                    <xsl:value-of select="name" />
                                    </xsl:when>
                                    <xsl:otherwise>
                                    <xsl:value-of select="." />
                                    </xsl:otherwise>
                                </xsl:choose>
                            </a>
                        </li>
                    </xsl:otherwise>
                </xsl:choose>            
			</xsl:for-each>
		</xsl:if>
		<xsl:if test="videos">
            <xsl:call-template name="videos"/>
		</xsl:if>
		<xsl:if test="limitations">
            <p class="A5">Limitations</p>
            <p><xsl:value-of select="limitations" /></p>
		</xsl:if>
		<xsl:if test="see">
            <xsl:call-template name="seeAlso" />
		</xsl:if>
        <xsl:if test="attribution">  <xsl:for-each select="attribution"><xsl:call-template name="attribution"/></xsl:for-each> </xsl:if>
	</xsl:template>
	<xsl:template match="list" name="list" >
		<xsl:choose>
               <xsl:when test="list/@bullet">
         <ul class="bulletList" >
            <xsl:for-each select="list/item">
                <li class="bulletItem">
                    <xsl:choose>
                        <xsl:when test="name/@href"> <a href="{name/@href}"><xsl:value-of select="name" /></a> </xsl:when>
                        <xsl:otherwise> <xsl:value-of select="name" /> </xsl:otherwise>
                    </xsl:choose>
                    <xsl:if test="description"> <span class="bulletItemDesc" > <xsl:for-each select="description"> <xsl:call-template name="text-content"/> </xsl:for-each> </span> </xsl:if>
                    <xsl:if test="list"> <xsl:call-template name="list"/> </xsl:if>
                </li>
            </xsl:for-each>
         </ul>        
               </xsl:when>
               <xsl:otherwise>
		<dl class="definitionTable" >
			<xsl:for-each select="list/item">
				<xsl:choose>
					<xsl:when test="name-title">
                        <dt class="definitionTableHead">
                            <xsl:value-of select="name-title" />
                        </dt>
                        <dd class="definitionTableHead">
                            <xsl:choose>
                                <xsl:when test="description-title">
                                    <xsl:value-of select="description-title" /></xsl:when>
                                <xsl:otherwise>Description</xsl:otherwise>
                            </xsl:choose>
                        </dd>
					</xsl:when>
					<xsl:otherwise>
                        <xsl:choose>
                            <xsl:when test="name/@href">
                                <dt class="definitionNameDT" >
                                    <a href="{name/@href}"><xsl:value-of select="name" /></a>
                                </dt>
                            </xsl:when>
                            <xsl:when test="name/@code">
                                <dt class="definitionNameDTCode" >
                                    <xsl:value-of select="name" />
                                </dt>
                            </xsl:when>
                            <xsl:otherwise>
                                <dt class="definitionNameDT" >
                                    <xsl:value-of select="name" />
                                </dt>
                            </xsl:otherwise>
                        </xsl:choose>
                        <dd class="definitionDescriptionDT">
                            <xsl:if test="./@build"><div class="buildBadge" data-build="{./@build}"><xsl:comment> </xsl:comment></div> </xsl:if>
                            <xsl:for-each select="description"> <xsl:call-template name="text-content"/> </xsl:for-each>
                            <xsl:if test="list">
                                <xsl:call-template name="list"/>
                            </xsl:if>
                            <xsl:call-template name="callouts-before"/>
                            <xsl:call-template name="callouts-after"/>
                        </dd>
					</xsl:otherwise>
				</xsl:choose>
			</xsl:for-each>
		</dl>
               </xsl:otherwise>
        </xsl:choose>       
	</xsl:template>
    <xsl:template match="sectionstep-content" name="sectionstep-content" >
        <xsl:if test="./@build"><div class="buildBadge" data-build="{./@build}"><xsl:comment> </xsl:comment></div> </xsl:if>
        <xsl:if test="title">
            <xsl:variable name="depth"><xsl:choose><xsl:when test="../../@depth"><xsl:value-of select="../../@depth" /></xsl:when><xsl:when test="title/@nested"><xsl:value-of select="title/@nested" /></xsl:when><xsl:otherwise>1</xsl:otherwise></xsl:choose></xsl:variable>
            <h3 class="section-level-{$depth}"><xsl:if test="title/@icon"><img src="((A5_BASE_PATH))pages{title/@icon}" /></xsl:if><a name="section{$depth}_{normalize-space(title)}"><xsl:value-of select="normalize-space(title)" /></a>&#160;</h3>
        </xsl:if>
        <xsl:choose>
            <xsl:when test="content">
                <p>
                    <xsl:value-of select="content" disable-output-escaping="yes" />
                </p>
            </xsl:when>
            <xsl:when test="discussion">
                <xsl:for-each select="discussion">
                    <xsl:call-template name="text-content"/>
                </xsl:for-each>
            </xsl:when>
            <xsl:when test="description">
                <xsl:for-each select="description">
                <xsl:call-template name="text-content"/>
                </xsl:for-each>
            </xsl:when>
            <xsl:otherwise></xsl:otherwise>
        </xsl:choose>
        <xsl:if test="list">
            <xsl:call-template name="list"/>
        </xsl:if>
        <xsl:if test="pages">
            <xsl:call-template name="pages"/>
        </xsl:if>
        <xsl:if test="example">
            <xsl:call-template name="example-template"></xsl:call-template>
        </xsl:if>
        <xsl:if test="steps">
             <xsl:call-template name="step-content"/>
        </xsl:if>
        <xsl:if test="cases">
             <xsl:call-template name="case-content"/>
        </xsl:if>
        <xsl:if test="figure">
            <xsl:for-each select="figure">
                <div class="figureContainer">
                    <xsl:choose>
                        <xsl:when test="content"><div class="sectionFigure"><xsl:value-of select="content" disable-output-escaping="yes" /></div> </xsl:when>
                        <xsl:otherwise> <a xsl:use-attribute-sets="href-link" class="sectionFigure"> <xsl:element name="img"> <xsl:attribute name="src"> <xsl:value-of select="link" /> </xsl:attribute> <xsl:if test="alt"> <xsl:attribute name="alt"> <xsl:value-of select="alt" /> </xsl:attribute> </xsl:if> </xsl:element> </a></xsl:otherwise>
                    </xsl:choose>
                    <xsl:if test="title">
                        <div class="figureTitle">
                            <xsl:value-of select="title" />
                        </div>
                    </xsl:if>
                </div>
            </xsl:for-each>
        </xsl:if>
        <xsl:call-template name="callouts-before"/>
        <xsl:call-template name="callouts-after"/>
        <xsl:if test="video">
            <xsl:for-each select="video">                
                    <xsl:choose>
                        <xsl:when test="./@embedded"> <div class="videoPlayer"> <iframe  src="{normalize-space(.)}" class="embeddedVideo" frameborder="0" allowfullscreen="true">loading...</iframe> </div> </xsl:when>
                        <xsl:otherwise>
                            <li>
                            <a xsl:use-attribute-sets="href-link">
                                <xsl:choose>                                
                                    <xsl:when test="name">
                                        <xsl:value-of select="name" />
                                    </xsl:when>
                                    <xsl:otherwise>
                                        <xsl:value-of select="." />
                                    </xsl:otherwise>
                                </xsl:choose>
                            </a>
                            </li>
                        </xsl:otherwise>
                    </xsl:choose>                
            </xsl:for-each>
        </xsl:if>
		<xsl:if test="videos">
            <xsl:call-template name="videos"/>        
		</xsl:if>
		<xsl:if test="see">
            <xsl:call-template name="seeAlso" />
		</xsl:if>
    </xsl:template>    
    <xsl:template match="seeAlso" name="seeAlso">
        <p class="A5">See Also</p>
        <ul>
            <xsl:for-each select="see/ref">
                <xsl:choose>
                    <xsl:when test="./@href">
                        <li>
                            <xsl:choose>
                                <xsl:when test="./@target">
                                    <a xsl:use-attribute-sets="ref-href-link" target="{./@target}"><xsl:value-of select="."/></a>
                                </xsl:when>
                                <xsl:otherwise>
                                    <a xsl:use-attribute-sets="ref-href-link"><xsl:value-of select="." /></a>
                                </xsl:otherwise>
                           </xsl:choose>
                        </li>
                    </xsl:when>
                    <xsl:when test="./@link">
                        <li>
                            <a href="((A5_BASE_PATH))index?search={./@link}">
                                <xsl:value-of select="." />
                            </a>
                        </li>
                    </xsl:when>
                    <xsl:otherwise>
                        <li>
                            <a href="javascript:helpServer.navigateClosestTopic('{normalize-space(.)}')">
                                <xsl:value-of select="." />
                            </a>
                        </li>
                    </xsl:otherwise>
                </xsl:choose>
            </xsl:for-each>
        </ul>
    </xsl:template>
    <xsl:template match="videos" name="videos" >    	
        <xsl:if test="videos/title">
            <h3 class="videosTitle"> <xsl:value-of select="videos/title" /> </h3>
        </xsl:if>
        <xsl:if test="videos/description">
            <xsl:for-each select="videos/description">
                <xsl:call-template name="text-content"/>
            </xsl:for-each>
        </xsl:if>
        <ul>
        <xsl:for-each select="videos/video">
            <xsl:choose>
                <xsl:when test="./@embedded"><div class="videoPlayer"> <iframe  src="{normalize-space(.)}" class="embeddedVideo" frameborder="0" allowfullscreen="true">loading...</iframe> </div> </xsl:when>
                <xsl:otherwise>
            <li><a xsl:use-attribute-sets="href-link"><xsl:choose>
                        <xsl:when test="name"><xsl:value-of select="name" /></xsl:when>
                        <xsl:otherwise><xsl:value-of select="." /></xsl:otherwise>
                    </xsl:choose></a></li>
                </xsl:otherwise>
            </xsl:choose>            
        </xsl:for-each>
        </ul>            
        <xsl:if test="videos/resources">
            <xsl:for-each select="videos/resources/resource">
                <p class="resourceVideoItem"><a xsl:use-attribute-sets="href-link"><xsl:choose>
                    <xsl:when test="name"><xsl:value-of select="name" /></xsl:when>
                    <xsl:otherwise>Download Component</xsl:otherwise>
                </xsl:choose></a></p>
            </xsl:for-each>
        </xsl:if>
        <xsl:if test="videos/date">
            <div class="videosDate">
                <xsl:value-of select="videos/date" />
            </div>
        </xsl:if>
    </xsl:template>

    <xsl:template match="text-content" name="text-content" >
        <xsl:choose>
            <xsl:when test="./@include">
                <div class="include-file"><xsl:value-of select="./@include" disable-output-escaping="yes" /></div>
            </xsl:when>
            <xsl:when test="p">
                <xsl:call-template name="text-html" />
            </xsl:when>
            <xsl:when test="table">
                <xsl:call-template name="text-html" />
            </xsl:when>
            <xsl:when test="list">
                <xsl:call-template name="text-html" />
            </xsl:when>
            <xsl:otherwise>
                <p><xsl:value-of select="." /></p>
            </xsl:otherwise>
        </xsl:choose>
    </xsl:template>    	
    
    <xsl:template name="text-html">
        <xsl:for-each select="*">
            <xsl:choose>
                <xsl:when test="local-name()='p'">
                    <xsl:choose>
                        <xsl:when test="table">
                            <xsl:call-template name="text-html" />
                        </xsl:when>
                        <xsl:when test="list">
                            <xsl:call-template name="list" />
                        </xsl:when>
                        <xsl:when test="example">
                            <xsl:call-template name="example-template" />
                        </xsl:when>
                        <xsl:when test="steps">
                            <xsl:call-template name="step-content" />
                        </xsl:when>
                        <xsl:when test="cases">
                            <xsl:call-template name="case-content" />
                        </xsl:when>
                        <xsl:otherwise>
                            <p><xsl:value-of select="." /></p>
                        </xsl:otherwise>
                    </xsl:choose>
                </xsl:when>
                <xsl:when test="local-name()='list'">
                    <xsl:call-template name="list"/>
                </xsl:when>
                <xsl:when test="local-name()='table'">
                    <div class="A5EmbeddedTable"><table class="A5Table">
                    <xsl:for-each select="tr">
                        <tr class="A5Row">
                        <xsl:for-each select="th">
                            <xsl:choose>
                                <xsl:when test="./@rowspan">
                                    <xsl:choose>
                                        <xsl:when test="./@colspan">
                                            <th class="A5Header" rowspan="{./@rowspan}" colspan="{./@colspan}"><xsl:call-template name="text-content" /></th>
                                        </xsl:when>
                                        <xsl:otherwise>
                                            <th class="A5Header" rowspan="{./@rowspan}"><xsl:call-template name="text-content" /></th>
                                        </xsl:otherwise>
                                    </xsl:choose>
                                </xsl:when>
                                <xsl:when test="./@colspan">
                                    <th class="A5Header" colspan="{./@colspan}"><xsl:call-template name="text-content" /></th>
                                </xsl:when>
                                <xsl:otherwise>
                                    <th class="A5Header"><xsl:call-template name="text-content" /></th>
                                </xsl:otherwise>
                            </xsl:choose>
                        </xsl:for-each>
                        <xsl:for-each select="td">
                            <xsl:choose>
                                <xsl:when test="./@rowspan">
                                    <xsl:choose>
                                        <xsl:when test="./@colspan">
                                            <td class="A5Cell" rowspan="{./@rowspan}" colspan="{./@colspan}"><xsl:call-template name="text-content"  /></td>
                                        </xsl:when>
                                        <xsl:otherwise>
                                            <td class="A5Cell" rowspan="{./@rowspan}"><xsl:call-template name="text-content"  /></td>
                                        </xsl:otherwise>
                                    </xsl:choose>
                                </xsl:when>
                                <xsl:when test="./@colspan">
                                    <td class="A5Cell" colspan="{./@colspan}"><xsl:call-template name="text-content"  /></td>
                                </xsl:when>
                                <xsl:otherwise>
                                    <td class="A5Cell"><xsl:call-template name="text-content" /></td>
                                </xsl:otherwise>
                            </xsl:choose>
                        </xsl:for-each>
                        </tr>
                    </xsl:for-each>
                    </table></div>
                </xsl:when>
            </xsl:choose>
        </xsl:for-each>
    </xsl:template>

    <xsl:template match="step-content" name="step-content" >
            <ol class="stepsOL">
                <xsl:for-each select="steps/step">
                    <li> <xsl:call-template name="sectionstep-content"/> </li>
                </xsl:for-each>
            </ol>
    </xsl:template>
    <xsl:template match="case-content" name="case-content" >
            <ul class="casesUL">
                <xsl:for-each select="cases/case">
                    <li> <xsl:call-template name="sectionstep-content"/> </li>
                </xsl:for-each>
            </ul>
    </xsl:template>
    <xsl:template match="section-content" name="section-content" >
			<xsl:for-each select="sections/section">
                <xsl:call-template name="sectionstep-content"/>
			</xsl:for-each>
    </xsl:template>
    
	<xsl:template match="properties-content" name="properties-content" >
        <xsl:param name = "depth" />
        <xsl:choose>
            <xsl:when test="$depth = '1'">
                <xsl:choose>
                    <xsl:when test="./@readonly">
                        <dt class="propertyReadonly" >
                            <span id="section{$depth}_{name}" name="section{$depth}_{name}"><xsl:value-of select="name" /></span>
                            <xsl:if test="types/type">
                                <span class="propertyTypes">
                                    <xsl:for-each select="types/type">
                                        <xsl:call-template name="type"><xsl:with-param name="typeClass" select="'propertyType'" /></xsl:call-template>
                                    </xsl:for-each>
                                </span>
                            </xsl:if>
                            <xsl:if test="type">
                                <xsl:for-each select="type">
                                        <xsl:call-template name="type"><xsl:with-param name="typeClass" select="'propertyType'" /></xsl:call-template>
                                </xsl:for-each>
                            </xsl:if>
                        </dt>
                    </xsl:when> 
                    <xsl:when test="./@writeonly">
                        <dt class="propertyWriteonly" >
                            <span id="section{$depth}_{name}" name="section{$depth}_{name}"><xsl:value-of select="name" /></span>
                            <xsl:if test="types/type">
                                <span class="propertyTypes">
                                    <xsl:for-each select="types/type">
                                        <xsl:call-template name="type"><xsl:with-param name="typeClass" select="'propertyType'" /></xsl:call-template>
                                    </xsl:for-each>
                                </span>
                            </xsl:if>
                            <xsl:if test="type">
                                <xsl:for-each select="type">
                                        <xsl:call-template name="type"><xsl:with-param name="typeClass" select="'propertyType'" /></xsl:call-template>
                                </xsl:for-each>
                            </xsl:if>
                        </dt>
                    </xsl:when> 
                    <xsl:when test="./@pseudo">
                        <dt class="propertyPseudo" >
                            <span id="section{$depth}_{name}" name="section{$depth}_{name}"><xsl:value-of select="name" /></span>
                            <xsl:if test="types/type">
                                <span class="propertyTypes">
                                    <xsl:for-each select="types/type">
                                        <xsl:call-template name="type"><xsl:with-param name="typeClass" select="'propertyType'" /></xsl:call-template>
                                    </xsl:for-each>
                                </span>
                            </xsl:if>
                            <xsl:if test="type">
                                <xsl:for-each select="type">
                                        <xsl:call-template name="type"><xsl:with-param name="typeClass" select="'propertyType'" /></xsl:call-template>
                                </xsl:for-each>
                            </xsl:if>
                        </dt>
                    </xsl:when> 
                    <xsl:when test="./@optional">
                        <dt class="propertyOptional" >
                            <span id="section{$depth}_{name}" name="section{$depth}_{name}"><xsl:value-of select="name" /></span>
                            <xsl:if test="types/type">
                                <span class="propertyTypes">
                                    <xsl:for-each select="types/type">
                                        <xsl:call-template name="type"><xsl:with-param name="typeClass" select="'propertyType'" /></xsl:call-template>
                                    </xsl:for-each>
                                </span>
                            </xsl:if>
                            <xsl:if test="type">
                                <xsl:for-each select="type">
                                        <xsl:call-template name="type"><xsl:with-param name="typeClass" select="'propertyType'" /></xsl:call-template>
                                </xsl:for-each>
                            </xsl:if>
                        </dt>
                    </xsl:when> 
                    <xsl:otherwise>
                        <dt class="propertyReadwrite" >
                            <span id="section{$depth}_{name}" name="section{$depth}_{name}"><xsl:value-of select="name" /></span>
                            <xsl:if test="types/type">
                                <span class="propertyTypes">
                                    <xsl:for-each select="types/type">
                                        <xsl:call-template name="type"><xsl:with-param name="typeClass" select="'propertyType'" /></xsl:call-template>
                                    </xsl:for-each>
                                </span>
                            </xsl:if>
                            <xsl:if test="type">
                                <xsl:for-each select="type">
                                        <xsl:call-template name="type"><xsl:with-param name="typeClass" select="'propertyType'" /></xsl:call-template>
                                </xsl:for-each>
                            </xsl:if>
                        </dt>
                    </xsl:otherwise>
                </xsl:choose>
            </xsl:when>
            <xsl:otherwise>
                <xsl:choose>
                    <xsl:when test="./@readonly">
                        <dt class="propertyReadonly" >
                            <xsl:value-of select="name" />
                            <xsl:if test="types/type">
                                <span class="propertyTypes">
                                    <xsl:for-each select="types/type">
                                        <xsl:call-template name="type"><xsl:with-param name="typeClass" select="'propertyType'" /></xsl:call-template>
                                    </xsl:for-each>
                                </span>
                            </xsl:if>
                            <xsl:if test="type">
                                <xsl:for-each select="type">
                                        <xsl:call-template name="type"><xsl:with-param name="typeClass" select="'propertyType'" /></xsl:call-template>
                                </xsl:for-each>
                            </xsl:if>
                        </dt>
                    </xsl:when> 
                    <xsl:when test="./@writeonly">
                        <dt class="propertyWriteonly" >
                            <xsl:value-of select="name" />
                            <xsl:if test="types/type">
                                <span class="propertyTypes">
                                    <xsl:for-each select="types/type">
                                        <xsl:call-template name="type"><xsl:with-param name="typeClass" select="'propertyType'" /></xsl:call-template>
                                    </xsl:for-each>
                                </span>
                            </xsl:if>
                            <xsl:if test="type">
                                <xsl:for-each select="type">
                                        <xsl:call-template name="type"><xsl:with-param name="typeClass" select="'propertyType'" /></xsl:call-template>
                                </xsl:for-each>
                            </xsl:if>
                        </dt>
                    </xsl:when> 
                    <xsl:when test="./@pseudo">
                        <dt class="propertyPseudo" >
                            <xsl:value-of select="name" />
                            <xsl:if test="types/type">
                                <span class="propertyTypes">
                                    <xsl:for-each select="types/type">
                                        <xsl:call-template name="type"><xsl:with-param name="typeClass" select="'propertyType'" /></xsl:call-template>
                                    </xsl:for-each>
                                </span>
                            </xsl:if>
                            <xsl:if test="type">
                                <xsl:for-each select="type">
                                        <xsl:call-template name="type"><xsl:with-param name="typeClass" select="'propertyType'" /></xsl:call-template>
                                </xsl:for-each>
                            </xsl:if>
                        </dt>
                    </xsl:when> 
                    <xsl:when test="./@optional">
                        <dt class="propertyOptional" >
                            <xsl:value-of select="name" />
                            <xsl:if test="types/type">
                                <span class="propertyTypes">
                                    <xsl:for-each select="types/type">
                                        <xsl:call-template name="type"><xsl:with-param name="typeClass" select="'propertyType'" /></xsl:call-template>
                                    </xsl:for-each>
                                </span>
                            </xsl:if>
                            <xsl:if test="type">
                                <xsl:for-each select="type">
                                    <xsl:call-template name="type"><xsl:with-param name="typeClass" select="'propertyType'" /></xsl:call-template>
                                </xsl:for-each>
                            </xsl:if>
                        </dt>
                    </xsl:when> 
                    <xsl:otherwise>
                        <dt class="propertyReadwrite" >
                            <xsl:value-of select="name" />
                            <xsl:if test="types/type">
                                <span class="propertyTypes">
                                    <xsl:for-each select="types/type">
                                        <xsl:call-template name="type"><xsl:with-param name="typeClass" select="'propertyType'" /></xsl:call-template>
                                    </xsl:for-each>
                                </span>
                            </xsl:if>
                            <xsl:if test="type">
                                <xsl:for-each select="type">
                                    <xsl:call-template name="type"><xsl:with-param name="typeClass" select="'propertyType'" /></xsl:call-template>
                                </xsl:for-each>
                            </xsl:if>
                        </dt>
                    </xsl:otherwise>
                </xsl:choose>
            </xsl:otherwise>
        </xsl:choose>
        <dd>
            <xsl:if test="./@build"><div class="buildBadge" data-build="{./@build}"><xsl:comment> </xsl:comment></div> </xsl:if>
            <xsl:call-template name="callouts-before"/>
            <xsl:for-each select="description"><xsl:call-template name="text-content"/></xsl:for-each>
            <xsl:if test="example">
                <xsl:call-template name="example-template"><xsl:with-param name="default_title">Example</xsl:with-param></xsl:call-template>
            </xsl:if>
            <xsl:if test="ref">
                <xsl:choose>
                    <xsl:when test="./@href"><a href="{./@href}"><xsl:value-of select="ref" /></a></xsl:when>
                    <xsl:otherwise><a href="javascript:helpServer.navigateClosestTopic('{normalize-space(ref)}')"><xsl:value-of select="ref" /></a></xsl:otherwise>
                </xsl:choose>
            </xsl:if>
            <xsl:if test="arguments"><xsl:call-template name="arguments"/></xsl:if>
            <xsl:if test="returns"><xsl:call-template name="returns-template" /> </xsl:if>
            <xsl:if test="properties">
                <dl class="propertiesDL" >
                    <xsl:for-each select="properties/property">
                        <xsl:call-template name="properties-content"><xsl:with-param name="depth" select = "$depth+1" /></xsl:call-template>
                    </xsl:for-each>
                </dl>
            </xsl:if>
            <xsl:if test="section">
                <xsl:for-each select="section">
                    <xsl:call-template name="sectionstep-content"/>
                </xsl:for-each>
            </xsl:if>
            <xsl:call-template name="callouts-after"/>            
        </dd>
    </xsl:template>

	<xsl:template match="arguments" name="arguments" >
		<dl class="argumentsDL">
			<xsl:for-each select="arguments/argument">
                <xsl:call-template name="inputs-outputs"></xsl:call-template>
            </xsl:for-each>
		</dl>
	</xsl:template>

     <xsl:template name="inputs-outputs">
            <dt>
                <xsl:value-of select="name" />
                <xsl:if test="types/type">
                    <span class="argumentTypes">
                        <xsl:for-each select="types/type">
                            <xsl:call-template name="type"><xsl:with-param name="typeClass" select="'argumentType'" /></xsl:call-template>
                        </xsl:for-each>
                    </span>
                </xsl:if>
                <xsl:if test="type">
                    <xsl:for-each select="type">
                        <xsl:call-template name="type"><xsl:with-param name="typeClass" select="'argumentType'" /></xsl:call-template>
                    </xsl:for-each>
                </xsl:if>
                <xsl:choose>
                    <xsl:when test="./@readonly">
                        <span class="argReadonly" ><xsl:comment> </xsl:comment></span>
                    </xsl:when> 
                    <xsl:when test="./@writeonly">
                        <span class="argWriteonly" ><xsl:comment> </xsl:comment></span>
                    </xsl:when> 
                    <xsl:when test="./@pseudo">
                        <span class="argPsuedo" ><xsl:comment> </xsl:comment></span>
                    </xsl:when> 
                    <xsl:when test="./@optional">
                        <span class="argOptional" ><xsl:comment> </xsl:comment></span>
                    </xsl:when>
                    <xsl:when test="./@byref">
                        <span class="argByref"><xsl:comment> </xsl:comment></span>
                    </xsl:when>
                </xsl:choose>
                </dt>
				<dd>
                    <xsl:if test="./@build"><div class="buildBadge" data-build="{./@build}"><xsl:comment> </xsl:comment></div> </xsl:if>
                    <xsl:call-template name="callouts-before"/>
					<xsl:choose>
						<xsl:when test="content">
							<xsl:value-of select="content" disable-output-escaping="yes" />
						</xsl:when>
						<xsl:when test="description">
                            <xsl:for-each select="description"><xsl:call-template name="text-content"/></xsl:for-each>
						</xsl:when>
					</xsl:choose>
                    <xsl:call-template name="callouts-after"/>

                    <xsl:if test="properties">
                        <dl class="propertiesDL" >
                            <xsl:for-each select="properties/property">
                            <xsl:call-template name="properties-content"><xsl:with-param name="depth"><xsl:choose><xsl:when test="../../@depth"><xsl:value-of select="../../@depth" /></xsl:when><xsl:otherwise>2</xsl:otherwise></xsl:choose></xsl:with-param></xsl:call-template>                
                            </xsl:for-each>
                        </dl>
                    </xsl:if>
					<xsl:if test="ref">
                        <xsl:choose>
                            <xsl:when test="./@href"><a href="{./@href}"><xsl:value-of select="ref" /></a></xsl:when>
                            <xsl:when test="./@link"><a href="((A5_BASE_PATH))index?search={./@link}"><xsl:value-of select="ref" /></a></xsl:when>
                            <xsl:otherwise><a href="javascript:helpServer.navigateClosestTopic('{normalize-space(ref)}')"><xsl:value-of select="ref" /></a></xsl:otherwise>
                        </xsl:choose>
					</xsl:if>
					<xsl:if test="list">
						<xsl:call-template name="list"/>
					</xsl:if>
                    <xsl:if test="sections">
                        <xsl:call-template name="section-content"/>
                    </xsl:if>
				</dd>
     </xsl:template>

     <xsl:template name="type">
        <xsl:param name="typeClass" />
        <span>
            <xsl:attribute name="class">
                <xsl:value-of select="$typeClass" />
            </xsl:attribute>
            <xsl:choose>
                <xsl:when test=".='C' or .='c'">Character </xsl:when>
                <xsl:when test=".='L' or .='l'">Logical </xsl:when>
                <xsl:when test=".='N' or .='n'">Numeric </xsl:when>
                <xsl:when test=".='P' or .='p'">Pointer </xsl:when>
                <xsl:when test=".='D' or .='d'">Date </xsl:when>
                <xsl:when test=".='T' or .='t'">Time </xsl:when>
                <xsl:when test=".='B' or .='b'">Binary </xsl:when>
                <xsl:when test=".='V' or .='v'">Void </xsl:when>
                <xsl:when test=".='A' or .='a'">Any Type </xsl:when>
                <xsl:when test=".='Y' or .='y'">Shortime </xsl:when>
                <xsl:when test=".='U' or .='u'">Collection </xsl:when>
                <xsl:when test=".='F' or .='f'">Function </xsl:when>
                <xsl:otherwise><xsl:value-of select="." /></xsl:otherwise>
            </xsl:choose>
            <xsl:comment></xsl:comment>
        </span>
     </xsl:template>

     <xsl:template name="callouts-before">
        <xsl:if test="warning">
            <xsl:choose>
                <xsl:when test="warning/p">
                    <div class="sectionWarning" ><xsl:for-each select="warning"><xsl:call-template name="text-content"/></xsl:for-each></div>
                </xsl:when>
                <xsl:otherwise>
                    <div class="sectionWarning" ><xsl:value-of select="warning" /></div> 
                </xsl:otherwise>
            </xsl:choose>
        </xsl:if>
        <xsl:if test="deprecated">
            <xsl:choose>
                <xsl:when test="deprecated/p">
                    <div class="sectionDeprecated" ><xsl:for-each select="deprecated"><xsl:call-template name="text-content"/></xsl:for-each></div>
                </xsl:when>
                <xsl:otherwise>
                    <div class="sectionDeprecated" ><xsl:value-of select="deprecated" /></div>
                </xsl:otherwise>
            </xsl:choose>
        </xsl:if>
        <xsl:if test="obsolete">
            <xsl:choose>
                <xsl:when test="obsolete/p">
                    <div class="sectionObsolete" ><xsl:for-each select="obsolete"><xsl:call-template name="text-content"/></xsl:for-each></div>
                </xsl:when>
                <xsl:otherwise>
                    <div class="sectionObsolete" ><xsl:value-of select="obsolete" /></div>
                </xsl:otherwise>
            </xsl:choose>
        </xsl:if>
   </xsl:template>

   <xsl:template name="callouts-after">
        <xsl:if test="note">
            <xsl:choose>
                <xsl:when test="note/p">
                    <div class="sectionNote" ><xsl:for-each select="note"><xsl:call-template name="text-content"/></xsl:for-each></div>
                </xsl:when>
                <xsl:otherwise>
                    <div class="sectionNote" ><xsl:value-of select="note" /></div>
                </xsl:otherwise>
            </xsl:choose>
        </xsl:if>
        <xsl:if test="important">
            <xsl:choose>
                <xsl:when test="important/p">
                    <div class="sectionImportant" ><xsl:for-each select="important"><xsl:call-template name="text-content"/></xsl:for-each></div>
                </xsl:when>
                <xsl:otherwise>
                    <div class="sectionImportant" ><xsl:value-of select="important" /></div>
                </xsl:otherwise>
            </xsl:choose>
        </xsl:if>
        <xsl:if test="tip">
            <xsl:choose>
                <xsl:when test="tip/p">
                    <div class="sectionTip" ><xsl:for-each select="tip"><xsl:call-template name="text-content"/></xsl:for-each></div>
                </xsl:when>
                <xsl:otherwise>
                    <div class="sectionTip" ><xsl:value-of select="tip" /></div>
                </xsl:otherwise>
            </xsl:choose>
        </xsl:if>
   </xsl:template>

   <xsl:template name="returns-template">
        <p class="A5">Returns</p>
        <xsl:choose>
            <xsl:when test="returns/return">
                <dl class="argumentsDL">
                    <xsl:variable name="typeClass" select="'argumentType'" />
                    <xsl:for-each select="returns/return"><xsl:call-template name="inputs-outputs"/></xsl:for-each>
                </dl>
            </xsl:when>
            <xsl:otherwise>
                <p><xsl:value-of select="." /></p>
            </xsl:otherwise>
        </xsl:choose>
   </xsl:template>

   <xsl:template name="example-template">
        <xsl:param name = "default_title" />
        <xsl:choose>
            <xsl:when test="example/@caption"><div class="figureTitle"><xsl:value-of select="example/@caption"/></div></xsl:when>        
            <xsl:when test="$default_title = 'Example'"><p class="A5">Example</p></xsl:when>
            <xsl:otherwise></xsl:otherwise>
        </xsl:choose>
        <xsl:choose>
            <xsl:when test="example/@include">
            <pre class="codeSection"><div class="include-file"><xsl:value-of select="example/@include" disable-output-escaping="yes" /></div></pre>
            </xsl:when>
            <xsl:when test="example/@code">
            <pre class="codeSection {example/@code}Lang"><xsl:call-template name="string-trim"><xsl:with-param name="string" select="example" /></xsl:call-template></pre>
            </xsl:when>
        <xsl:otherwise>
            <pre class="codeSection"><xsl:call-template name="string-trim"><xsl:with-param name="string" select="example" /></xsl:call-template></pre></xsl:otherwise>
        </xsl:choose>
   </xsl:template>

   <xsl:template match="attribution" name="attribution" >
        <div class="attribution">
        <xsl:if test="title"><div class="attributionTitle"><xsl:value-of select="title" /></div> </xsl:if>     
        <xsl:if test="author"><div class="attributionAuthor"><xsl:value-of select="author" /></div> </xsl:if>
        <xsl:if test="source"><div class="attributionSource"><xsl:value-of select="source" /></div> </xsl:if>
        <xsl:if test="license"><div class="attributionLicense"><xsl:value-of select="license" /></div> </xsl:if>
        </div>
   </xsl:template>

	<xsl:attribute-set name="href-link">
		<xsl:attribute name="href">
            <xsl:choose>
                <xsl:when test="link"><xsl:value-of select="link" /></xsl:when>
                <xsl:when test="name"><xsl:value-of select="name" /></xsl:when>
                <xsl:otherwise><xsl:value-of select="." /></xsl:otherwise>
            </xsl:choose>
		</xsl:attribute>
	</xsl:attribute-set>
	<xsl:attribute-set name="ref-href-link">
		<xsl:attribute name="href">
			<xsl:value-of select="./@href" />
		</xsl:attribute>
	</xsl:attribute-set>

    <xsl:variable name="whitespace" select="'&#09;&#10;&#13; '" />

<!-- Strips trailing whitespace characters from 'string' -->
<xsl:template name="string-rtrim">
    <xsl:param name="string" />
    <xsl:param name="trim" select="$whitespace" />

    <xsl:variable name="length" select="string-length($string)" />

    <xsl:if test="$length &gt; 0">
        <xsl:choose>
            <xsl:when test="contains($trim, substring($string, $length, 1))">
                <xsl:call-template name="string-rtrim">
                    <xsl:with-param name="string" select="substring($string, 1, $length - 1)" />
                    <xsl:with-param name="trim"   select="$trim" />
                </xsl:call-template>
            </xsl:when>
            <xsl:otherwise>
                <xsl:value-of select="$string" />
            </xsl:otherwise>
        </xsl:choose>
    </xsl:if>
</xsl:template>

<!-- Strips leading whitespace characters from 'string' -->
<xsl:template name="string-ltrim">
    <xsl:param name="string" />
    <xsl:param name="trim" select="$whitespace" />

    <xsl:if test="string-length($string) &gt; 0">
        <xsl:choose>
            <xsl:when test="contains($trim, substring($string, 1, 1))">
                <xsl:call-template name="string-ltrim">
                    <xsl:with-param name="string" select="substring($string, 2)" />
                    <xsl:with-param name="trim"   select="$trim" />
                </xsl:call-template>
            </xsl:when>
            <xsl:otherwise>
                <xsl:value-of select="$string" />
            </xsl:otherwise>
        </xsl:choose>
    </xsl:if>
</xsl:template>

<!-- Strips leading and trailing whitespace characters from 'string' -->
<xsl:template name="string-trim">
    <xsl:param name="string" />
    <xsl:param name="trim" select="$whitespace" />
    <xsl:call-template name="string-rtrim">
        <xsl:with-param name="string">
            <xsl:call-template name="string-ltrim">
                <xsl:with-param name="string" select="$string" />
                <xsl:with-param name="trim"   select="$trim" />
            </xsl:call-template>
        </xsl:with-param>
        <xsl:with-param name="trim"   select="$trim" />
    </xsl:call-template>
</xsl:template>

</xsl:stylesheet>