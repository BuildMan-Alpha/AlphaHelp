<xsl:stylesheet xmlns:xsl="http://www.w3.org/1999/XSL/Transform" version="1.0">
	<xsl:template match="/">
		<xsl:for-each select="page">
			<xsl:call-template name="page-content"/>
		</xsl:for-each>
	</xsl:template>
	<xsl:template match="pages" name="pages" >
        <xsl:for-each select="pages/page">
			<xsl:call-template name="page-content"/>
		</xsl:for-each>
	</xsl:template>
	<xsl:template match="page-content" name="page-content" >
        <xsl:if test="./@reorder-children"><xsl:comment>orderchildren</xsl:comment> </xsl:if>
        <xsl:if test="links">
            <script id="definePageLinks" type="text/xmldata" >
                <xsl:for-each select="links/link">
                    <xsl:choose>
                        <xsl:when test="./@href">
                            <xsl:choose>
                                <xsl:when test="./@target">
                                    <a href="{./@href}"><xsl:value-of select="." target="./@target"/></a>
                                </xsl:when>
                                <xsl:otherwise>
                                    <a href="{./@href}"><xsl:value-of select="." /></a>
                                </xsl:otherwise>
                           </xsl:choose>
                        </xsl:when>
                        <xsl:when test="./@target">
                            <a><xsl:value-of select="." target="./@target"/></a>
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
           <xsl:otherwise>
                <xsl:if test="topic"><h1><xsl:value-of select="topic" /></h1></xsl:if>
                <xsl:if test="name"> <h1><xsl:value-of select="name" /></h1></xsl:if>
           </xsl:otherwise>
        </xsl:choose>   
		<xsl:if test="syntax">
			<p class="A5">Syntax</p>
			<xsl:value-of select="syntax" />
		</xsl:if>
		<xsl:if test="prototype">
			<p class="A5">Syntax</p>            
               <xsl:choose>
                    <xsl:when test="prototype/@static">
                        <span class="methodStatic"><xsl:value-of select="prototype" /></span>
                    </xsl:when>
                    <xsl:otherwise>
                        <xsl:value-of select="prototype" />
                    </xsl:otherwise>
               </xsl:choose>
		</xsl:if>
		<xsl:if test="prototypes">
			<p class="A5">Syntax</p>          
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
		</xsl:if>
		<xsl:if test="arguments">
			<xsl:call-template name="arguments"/>    
		</xsl:if>
		<xsl:if test="returns">
			<p class="A5">Returns</p>
			<p><xsl:value-of select="returns" /> </p>
		</xsl:if>
		<xsl:if test="description">
            <meta name="description" content="{description}"/>
			<p class="A5">Description</p>
            <xsl:for-each select="description">
                <xsl:call-template name="text-content"/>
            </xsl:for-each>
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
				<p>
                <xsl:for-each select="discussion">
                    <xsl:call-template name="text-content"/>
                </xsl:for-each>
                </p>
			</xsl:when>
		</xsl:choose>
        <xsl:if test="list">
            <xsl:call-template name="list"/>
        </xsl:if>
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
			<p class="A5">Properties</p>
            <dl class="propertiesDL" >
                <xsl:for-each select="properties/property">
                <xsl:call-template name="properties-content"/>
                </xsl:for-each>
            </dl>
		</xsl:if>
		<xsl:if test="methods">
			<p class="A5">Methods</p>
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
					<dd><xsl:if test="arguments"><xsl:if test="arguments"><xsl:call-template name="arguments"/></xsl:if></xsl:if>
            		<xsl:if test="returns"><p class="A5">Returns</p><p><xsl:value-of select="returns" /> </p> </xsl:if>                    						
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
					</dd>
				</xsl:for-each>
				<xsl:for-each select="methods/methodref">
                    <xsl:if test="name">
                        <xsl:choose>
                            <xsl:when test="./@static">
                            <xsl:choose>
                            <xsl:when test="ref/@href"><dt class="methodStatic"><a href="{ref/@href}"><xsl:value-of select="name" /></a></dt></xsl:when>
                            <xsl:when test="ref"><dt class="methodStatic"><a href="/documentation/index?search={ref}"><xsl:value-of select="name" /></a></dt></xsl:when>
                            <xsl:otherwise><dt class="methodStatic"><a href="javascript:helpServer.navigateClosestTopic('{normalize-space(name)}')"><xsl:value-of select="name" /></a></dt></xsl:otherwise>
                            </xsl:choose>
                            </xsl:when>
                            <xsl:otherwise>
                            <xsl:choose>
                            <xsl:when test="ref/@href"><dt><a href="{ref/@href}"><xsl:value-of select="name" /></a></dt></xsl:when>
                            <xsl:when test="ref"><dt><a href="/documentation/index?search={ref}"><xsl:value-of select="name" /></a></dt></xsl:when>
                            <xsl:otherwise><dt><a href="javascript:helpServer.navigateClosestTopic('{normalize-space(name)}')"><xsl:value-of select="name" /></a></dt></xsl:otherwise>
                            </xsl:choose>
                            </xsl:otherwise>
                        </xsl:choose>                                            
                        <dd><xsl:for-each select="description"><xsl:call-template name="text-content"/></xsl:for-each></dd>
                    </xsl:if>    
				</xsl:for-each>
			</dl>
		</xsl:if>
		<xsl:if test="classes">
			<xsl:for-each select="classes/class">
				<xsl:call-template name="page-content"/>
			</xsl:for-each>
		</xsl:if>
        <xsl:if test="note">        
            <xsl:choose>
                <xsl:when test="note/p">
                    <div class="sectionNote" ><xsl:for-each select="note/p"><p><xsl:value-of select="." /></p></xsl:for-each></div>
                </xsl:when>
                <xsl:otherwise>
                    <div class="sectionNote" ><xsl:value-of select="note" /></div>
                </xsl:otherwise>
            </xsl:choose>
        </xsl:if>
        <xsl:if test="warning">
           <div class="sectionWarning" > <xsl:value-of select="warning" /> </div>
        </xsl:if>
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
		</xsl:if>
		<xsl:if test="limitations">
            <p class="A5">Limitations</p>
            <p><xsl:value-of select="limitations" /></p>
		</xsl:if>
		<xsl:if test="see">
			<p class="A5">See Also</p>
			<ul>
				<xsl:for-each select="see/ref">
					<xsl:choose>
						<xsl:when test="./@href">
							<li>
								<a xsl:use-attribute-sets="ref-href-link">
									<xsl:value-of select="." />
								</a>
							</li>
						</xsl:when>
						<xsl:when test="./@link">
							<li>
								<a href="/documentation/index?search={./@link}">
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
		</xsl:if>	
	</xsl:template>
	<xsl:template match="list" name="list" >
		<dl class="definitionTable" >
			<xsl:for-each select="list/item">
				<xsl:choose>
					<xsl:when test="name-title">
						<div>
							<div style="white-space: nowrap; text-align: left;padding-right:8pt;">
								<xsl:value-of select="name-title" />
							</div>
							<div style="white-space: nowrap; text-align: left;">
								<xsl:choose>
									<xsl:when test="description-title">
										<xsl:value-of select="description-title" /></xsl:when>
									<xsl:otherwise>Description</xsl:otherwise>
								</xsl:choose>
							</div>
						</div>
					</xsl:when>
					<xsl:otherwise>
						<div>
							<dt class="definitionNameTD" >
                                <xsl:choose>
                                    <xsl:when test="name/@href">
                                        <a href="{name/@href}"><xsl:value-of select="name" /></a>
                                    </xsl:when>
                                    <xsl:otherwise>
                                        <xsl:value-of select="name" />
                                    </xsl:otherwise>
                                </xsl:choose>
							</dt>
							<dd class="definitionDescriptionTD">
								<xsl:value-of select="description" />
								<xsl:if test="list">
								    <xsl:call-template name="list"/>
								</xsl:if>
							</dd>
						</div>
					</xsl:otherwise>
				</xsl:choose>
			</xsl:for-each>
		</dl>
	</xsl:template>
    <xsl:template match="sectionstep-content" name="sectionstep-content" >
        <xsl:if test="title">
            <xsl:variable name="depth"><xsl:choose><xsl:when test="../../@depth"><xsl:value-of select="../../@depth" /></xsl:when><xsl:when test="title/@nested"><xsl:value-of select="title/@nested" /></xsl:when><xsl:otherwise>1</xsl:otherwise></xsl:choose></xsl:variable>
            <h3 class="section-level-{$depth}"><a name="section{$depth}_{normalize-space(title)}"><xsl:value-of select="normalize-space(title)" /> </a></h3>
        </xsl:if>
        <xsl:choose>
            <xsl:when test="content">
                <p>
                    <xsl:value-of select="content" disable-output-escaping="yes" />
                </p>
            </xsl:when>
            <xsl:when test="discussion">
                <p>
                    <xsl:for-each select="discussion">
                        <xsl:call-template name="text-content"/>
                    </xsl:for-each>
                </p>
            </xsl:when>
            <xsl:when test="description">
                <p>
                    <xsl:for-each select="description">
                    <xsl:call-template name="text-content"/>
                    </xsl:for-each>
                </p>
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
            <xsl:choose>
            <xsl:when test="example/@include">
            <pre class="codeSection"><div class="include-file"><xsl:value-of select="example/@include" disable-output-escaping="yes" /></div></pre>
            </xsl:when>
            <xsl:otherwise>
            <pre class="codeSection"><xsl:value-of select="example" /></pre>
            </xsl:otherwise>
            </xsl:choose>            
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
        <xsl:if test="note">
            <xsl:choose>
                <xsl:when test="note/p">
                    <div class="sectionNote" ><xsl:for-each select="note/p"><p><xsl:value-of select="." /></p></xsl:for-each></div>
                </xsl:when>
                <xsl:otherwise>
                    <div class="sectionNote" ><xsl:value-of select="note" /></div>
                </xsl:otherwise>
            </xsl:choose>
        </xsl:if>
        <xsl:if test="warning">
           <div class="sectionWarning" > <xsl:value-of select="warning" /> </div>
        </xsl:if>
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
			<xsl:for-each select="videos/video">
                <xsl:choose>
                    <xsl:when test="./@embedded"> <div class="videoPlayer"> <iframe  src="{normalize-space(.)}" class="embeddedVideo" frameborder="0" allowfullscreen="true">loading...</iframe> </div> </xsl:when>
                    <xsl:otherwise><li><a xsl:use-attribute-sets="href-link">
                        <xsl:choose>
                            <xsl:when test="name"><xsl:value-of select="name" /></xsl:when>
                            <xsl:otherwise><xsl:value-of select="." /></xsl:otherwise>
                        </xsl:choose></a></li>
                    </xsl:otherwise>
                </xsl:choose>                
			</xsl:for-each>
		</xsl:if>
    </xsl:template>    	
    <xsl:template match="text-content" name="text-content" >
        <xsl:choose>
            <xsl:when test="./@include">
                <div class="include-file"><xsl:value-of select="./@include" disable-output-escaping="yes" /></div>
            </xsl:when>
            <xsl:when test="p">
                <xsl:for-each select="p">
                    <p>  <xsl:value-of select="." /> </p>
                </xsl:for-each>
            </xsl:when>
            <xsl:otherwise>
                <p><xsl:value-of select="." /></p>
            </xsl:otherwise>
        </xsl:choose>
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
        <xsl:variable name="depth"><xsl:choose><xsl:when test="../../@depth"><xsl:value-of select="../../@depth" /></xsl:when><xsl:otherwise>1</xsl:otherwise></xsl:choose></xsl:variable>
        <xsl:choose>
            <xsl:when test="./@readonly">
                <dt class="propertyReadonly" ><a name="section{$depth}_{name}" ><xsl:value-of select="name" /></a></dt>
            </xsl:when> 
            <xsl:when test="./@writeonly">
                <dt class="propertyWriteonly" ><a name="section{$depth}_{name}" ><xsl:value-of select="name" /></a></dt>
            </xsl:when> 
            <xsl:when test="./@pseudo">
                <dt class="propertyPseudo" ><a name="section{$depth}_{name}" ><xsl:value-of select="name" /></a></dt>
            </xsl:when> 
            <xsl:otherwise>
                <dt class="propertyReadwrite" ><a name="section{$depth}_{name}" ><xsl:value-of select="name" /></a></dt>
            </xsl:otherwise>
        </xsl:choose> 
        <dd><xsl:value-of select="description" />
            <xsl:if test="example">
            <xsl:choose>
            <xsl:when test="example/@include"><b class="A5">Example</b><pre class="codeSection"><div class="include-file"><xsl:value-of select="example/@include" disable-output-escaping="yes" /></div></pre></xsl:when>
            <xsl:otherwise> <b class="A5">Example</b> <pre class="codeSection"><xsl:value-of select="example" /></pre> </xsl:otherwise>
            </xsl:choose></xsl:if>							 
            <xsl:if test="ref">
                <xsl:choose>
                    <xsl:when test="./@href"><a href="{./@href}"><xsl:value-of select="ref" /></a></xsl:when>
                    <xsl:otherwise><a href="javascript:helpServer.navigateClosestTopic('{normalize-space(ref)}')"><xsl:value-of select="ref" /></a></xsl:otherwise>
                </xsl:choose>
            </xsl:if>
            <xsl:if test="arguments"><xsl:call-template name="arguments"/></xsl:if>
            <xsl:if test="returns"><p class="A5">Returns</p><p><xsl:value-of select="returns" /> </p> </xsl:if>
            <xsl:if test="properties">
                <dl class="propertiesDL" >
                    <xsl:for-each select="properties/property">
                        <xsl:call-template name="properties-content"/>
                    </xsl:for-each>
                </dl>
            </xsl:if>
            <xsl:if test="section">
                <xsl:for-each select="section">
                    <xsl:call-template name="sectionstep-content"/>
                </xsl:for-each>
            </xsl:if>
        </dd>
    </xsl:template>
	<xsl:template match="arguments" name="arguments" >
		<dl class="argumentsDL">
			<xsl:for-each select="arguments/argument">
				<dt><xsl:value-of select="name" /></dt>
				<dd>
					<xsl:choose>
						<xsl:when test="content">
							<xsl:value-of select="content" disable-output-escaping="yes" />
						</xsl:when>
						<xsl:when test="description">
                            <xsl:for-each select="description"><xsl:call-template name="text-content"/></xsl:for-each>							
						</xsl:when>
					</xsl:choose>
					<xsl:if test="ref">
                        <xsl:choose>
                            <xsl:when test="./@href"><a href="{./@href}"><xsl:value-of select="ref" /></a></xsl:when>
                            <xsl:when test="./@link"><a href="/documentation/index?search={./@link}"><xsl:value-of select="ref" /></a></xsl:when>
                            <xsl:otherwise><a href="javascript:helpServer.navigateClosestTopic('{normalize-space(ref)}')"><xsl:value-of select="ref" /></a></xsl:otherwise>
                        </xsl:choose>
					</xsl:if>
					<xsl:if test="list">
						<xsl:call-template name="list"/>
					</xsl:if>
				</dd>
			</xsl:for-each>
		</dl>
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
</xsl:stylesheet>