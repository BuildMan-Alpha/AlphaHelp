<xsl:stylesheet xmlns:xsl="http://www.w3.org/1999/XSL/Transform" version="1.0">
	<xsl:template match="/">
		<xsl:for-each select="page">
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
                            <a href="{./@href}"><xsl:value-of select="." /></a>
                        </xsl:when>
                        <xsl:otherwise>
                            <a><xsl:value-of select="." /></a>
                        </xsl:otherwise>
                    </xsl:choose>
                </xsl:for-each>
            </script>
        </xsl:if>
		<xsl:if test="topic">
		<p>
			<p class="A3Function">
				<xsl:value-of select="topic" />
			</p>
		</p>
		</xsl:if>
		<xsl:if test="name">
		<p>
			<p class="A3Function">
				<xsl:value-of select="name" />
			</p>
		</p>
		</xsl:if>
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
		<xsl:if test="description">
            <meta name="description" content="{description}"/>
			<p class="A5">Description</p>
			<p>
				<xsl:value-of select="description" /> </p>
		</xsl:if>
		<xsl:choose>
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
					<xsl:value-of select="discussion" /> </p>
			</xsl:when>
		</xsl:choose>
        <xsl:if test="list">
            <xsl:call-template name="list"/>
        </xsl:if>
		<xsl:if test="example">
			<b class="A5">Example</b> <pre class="codeSection"><xsl:value-of select="example" /></pre>
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
                                    <p class="A5">
                                        <a name="group_{title}"><xsl:value-of select="title" /> </a>
                                    </p>
                                </xsl:if>
                                <xsl:call-template name="section-content"/>
                        </div>   
                    </xsl:when>    
                    <xsl:otherwise>
                        <div class="pagegroup">
                            <xsl:if test="title">
                                <p class="A5">
                                    <a name="group_{title}"><xsl:value-of select="title" /> </a>
                                </p>
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
						<xsl:value-of select="description" />
						<xsl:if test="example">
							<b class="A5">Example</b> <pre class="codeSection"><xsl:value-of select="example" /></pre>
						</xsl:if>
                        <xsl:if test="ref">
                            <xsl:choose>
                                <xsl:when test="./@href"><a href="{./@href}"><xsl:value-of select="ref" /></a></xsl:when>
                                <xsl:otherwise><a onclick="helpServer.navigateClosestTopic(this.innerText || this.text)"><xsl:value-of select="ref" /></a></xsl:otherwise>
                            </xsl:choose>
                        </xsl:if>													
					</dd>
				</xsl:for-each>
				<xsl:for-each select="methods/methodref">
                    <xsl:if test="name">
                        <xsl:choose>
                            <xsl:when test="./@static">
                            <dt class="methodStatic"><a onclick="helpServer.navigateClosestTopic(this.innerText || this.text)"><xsl:value-of select="name" /></a></dt>
                            </xsl:when>
                            <xsl:otherwise>
                            <dt><a onclick="helpServer.navigateClosestTopic(this.innerText || this.text)"><xsl:value-of select="name" /></a></dt>
                            </xsl:otherwise>
                        </xsl:choose>                                            
                        <dd><xsl:value-of select="description" /></dd>
                    </xsl:if>    
				</xsl:for-each>
			</dl>
		</xsl:if>
		<xsl:if test="classes">
			<xsl:for-each select="classes/class">
				<xsl:call-template name="page-content"/>
			</xsl:for-each>
		</xsl:if>
		<xsl:if test="video">
			<xsl:for-each select="video">
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
			</xsl:for-each>
		</xsl:if>
		<xsl:if test="videos">
			<xsl:for-each select="videos/video">
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
						<xsl:otherwise>
							<li>
								<a onclick="helpServer.navigateClosestTopic(this.innerText || this.text)">
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
            <p class="A5">
                <a name="section_{title}"><xsl:value-of select="title" /> </a>
            </p>
        </xsl:if>
        <xsl:choose>
            <xsl:when test="content">
                <p>
                    <xsl:value-of select="content" disable-output-escaping="yes" />
                </p>
            </xsl:when>
            <xsl:when test="discussion">
                <p>
                    <xsl:value-of select="discussion" />
                </p>
            </xsl:when>
            <xsl:when test="description">
                <p>
                    <xsl:value-of select="description" />
                </p>
            </xsl:when>
            <xsl:otherwise></xsl:otherwise>
        </xsl:choose>
        <xsl:if test="list">
            <xsl:call-template name="list"/>
        </xsl:if>
        <xsl:if test="example">
            <pre class="codeSection"><xsl:value-of select="example" /></pre>
        </xsl:if>
        <xsl:if test="steps">
             <xsl:call-template name="step-content"/>
        </xsl:if>
        <xsl:if test="cases">
             <xsl:call-template name="case-content"/>
        </xsl:if>
        <xsl:if test="figure">
            <xsl:for-each select="figure">
                <img xsl:use-attribute-sets="src-link" class="sectionFigure" />
                <xsl:if test="title">
                    <p>
                        <xsl:value-of select="title" />
                    </p>
                </xsl:if>
            </xsl:for-each>
        </xsl:if>
        <xsl:if test="note">
           <div class="sectionNote" > <xsl:value-of select="note" /> </div>
        </xsl:if>
        <xsl:if test="video">
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
        </xsl:if>
		<xsl:if test="videos">
			<xsl:for-each select="videos/video">
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
			</xsl:for-each>
		</xsl:if>
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
        <xsl:choose>
            <xsl:when test="./@readonly">
                <dt class="propertyReadonly" ><xsl:value-of select="name" /></dt>
            </xsl:when> 
            <xsl:when test="./@writeonly">
                <dt class="propertyWriteonly" ><xsl:value-of select="name" /></dt>
            </xsl:when> 
            <xsl:when test="./@pseudo">
                <dt class="propertyPseudo"><xsl:value-of select="name" /></dt>
            </xsl:when> 
            <xsl:otherwise>
                <dt class="propertyReadwrite" ><xsl:value-of select="name" /></dt>
            </xsl:otherwise>
        </xsl:choose> 
        <dd><xsl:value-of select="description" />
            <xsl:if test="example"><b class="A5">Example</b> <pre class="codeSection"><xsl:value-of select="example" /></pre></xsl:if>							 
            <xsl:if test="ref">
                <xsl:choose>
                    <xsl:when test="./@href"><a href="{./@href}"><xsl:value-of select="ref" /></a></xsl:when>
                    <xsl:otherwise><a onclick="helpServer.navigateClosestTopic(this.innerText || this.text)"><xsl:value-of select="ref" /></a></xsl:otherwise>
                </xsl:choose>
            </xsl:if>
            <xsl:if test="arguments"><xsl:call-template name="arguments"/></xsl:if>
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
							<xsl:value-of select="description" />
						</xsl:when>
					</xsl:choose>
					<xsl:if test="ref">
                        <xsl:choose>
                            <xsl:when test="./@href"><a href="{./@href}"><xsl:value-of select="ref" /></a></xsl:when>
                            <xsl:otherwise><a onclick="helpServer.navigateClosestTopic(this.innerText || this.text)"><xsl:value-of select="ref" /></a></xsl:otherwise>
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
			<xsl:value-of select="link" />
		</xsl:attribute>
	</xsl:attribute-set>
	<xsl:attribute-set name="ref-href-link">
		<xsl:attribute name="href">
			<xsl:value-of select="./@href" />
		</xsl:attribute>
	</xsl:attribute-set>
	<xsl:attribute-set name="src-link">
		<xsl:attribute name="src">
			<xsl:value-of select="link" />
		</xsl:attribute>
	</xsl:attribute-set>
</xsl:stylesheet>