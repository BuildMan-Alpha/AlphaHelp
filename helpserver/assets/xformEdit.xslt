<xsl:stylesheet xmlns:xsl="http://www.w3.org/1999/XSL/Transform" version="1.0">
	<xsl:template match="/">
		<xsl:for-each select="page">
			<xsl:call-template name="page-content"/>
		</xsl:for-each>
	</xsl:template>
	<xsl:template match="page-content" name="page-content" >
		<xsl:if test="topic">
		<p>
			<p class="A3Function" id="topic" >
				<xsl:value-of select="topic" />
			</p>
		</p>
		</xsl:if>
		<xsl:if test="name">
		<p>
			<p class="A3Function" id="name">
				<xsl:value-of select="name" />
			</p>
		</p>
		</xsl:if>
		<xsl:if test="syntax">
			<p class="A5" >Syntax</p>
			<div id="syntax"><xsl:value-of select="syntax" /></div>
            <button id="addPrototype">Add Prototype...</button>
		</xsl:if>
		<xsl:if test="prototype">
			<p class="A5">Syntax</p>
			<div id="prototype"><xsl:value-of select="prototype" /></div>
            <button id="addPrototype">Add Prototype...</button>
		</xsl:if>
		<xsl:if test="prototypes">
			<p class="A5">Syntax</p>
			<xsl:for-each select="prototypes/prototype">
			<p id="prototype_{position()}"><xsl:value-of select="." /></p>
			</xsl:for-each>
            <button id="addPrototype">Add Prototype...</button>
		</xsl:if>
		<xsl:if test="arguments">
			<xsl:call-template name="arguments"/>    
		</xsl:if>
		<xsl:if test="description">
            <meta name="description" content="{description}"/>
			<p class="A5">Description</p>
			<p id="description"> <xsl:value-of select="description" /> </p>
		</xsl:if>
		<xsl:choose>
			<xsl:when test="content">
				<p class="A5">Discussion</p>
				<p id="discussion">
					<xsl:value-of select="content" disable-output-escaping="yes" /> </p>
			</xsl:when>
			<xsl:when test="discussion/@type='html'">
				<p class="A5">Discussion</p>
				<p id="discussion-rich"><xsl:value-of select="discussion" disable-output-escaping="yes" /> </p>
			</xsl:when>
			<xsl:when test="discussion">
				<p class="A5">Discussion</p>
				<p id="discussion"><xsl:value-of select="discussion" /> </p>
			</xsl:when>
		</xsl:choose>
        <xsl:if test="list">
            <xsl:call-template name="list"/>
        </xsl:if>
		<xsl:if test="example">
			<b class="A5">Example</b> <pre class="codeTable" id="example" ><xsl:value-of select="example" /></pre>
		</xsl:if>
		<xsl:if test="sections">
			<xsl:for-each select="sections/section">
				<xsl:if test="title">
					<p class="A5">
						<xsl:value-of select="title" />
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
					<pre class="codeTable"><xsl:value-of select="example" /></pre>
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
				<xsl:if test="video">
					<li>
						<a xsl:use-attribute-sets="href-link">
							<xsl:value-of select="name" />
						</a>
					</li>
				</xsl:if>
			</xsl:for-each>
		</xsl:if>
		<xsl:if test="properties">
			<p class="A5">Properties</p>
			<dl class="propertiesDL" >
				<xsl:for-each select="properties/property">
					<dt><xsl:value-of select="name" /></dt>
					<dd><xsl:value-of select="description" />
						<xsl:if test="example"><b class="A5">Example</b> <pre class="codeTable"><xsl:value-of select="example" /></pre></xsl:if>							 
						<xsl:if test="ref">
                            <xsl:choose>
                                <xsl:when test="./@href"><a href="{./@href}"><xsl:value-of select="ref" /></a></xsl:when>
                                <xsl:otherwise><a onclick="helpServer.navigateClosestTopic(this.innerText || this.text)"><xsl:value-of select="ref" /></a></xsl:otherwise>
                            </xsl:choose>
                        </xsl:if>							
					</dd>
				</xsl:for-each>
			</dl>
		</xsl:if>
		<xsl:if test="methods">
			<p class="A5">Methods</p>
			<dl class="methodsDL" >
				<xsl:for-each select="methods/method">
					<xsl:if test="syntax"><dt><xsl:value-of select="syntax" /></dt></xsl:if>
					<dd><xsl:if test="arguments"><xsl:if test="arguments"><xsl:call-template name="arguments"/></xsl:if></xsl:if>						
						<xsl:value-of select="description" />
						<xsl:if test="example">
							<b class="A5">Example</b> <pre class="codeTable"><xsl:value-of select="example" /></pre>
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
                        <dt><a onclick="helpServer.navigateClosestTopic(this.innerText || this.text)"><xsl:value-of select="name" /></a></dt>                    
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
						<xsl:value-of select="name" />
					</a>
				</li>
			</xsl:for-each>
		</xsl:if>
		<xsl:if test="videos">
			<xsl:for-each select="videos/video">
				<li>
					<a xsl:use-attribute-sets="href-link">
						<xsl:value-of select="name" />
					</a>
				</li>
			</xsl:for-each>
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
		<table class="definitionTable" >
			<xsl:for-each select="list/item">
				<xsl:choose>
					<xsl:when test="name-title">
						<tr>
							<th style="white-space: nowrap; text-align: left;padding-right:8pt;">
								<xsl:value-of select="name-title" />
							</th>
							<th style="white-space: nowrap; text-align: left;">
								<xsl:choose>
									<xsl:when test="description-title">
										<xsl:value-of select="description-title" /></xsl:when>
									<xsl:otherwise>Description</xsl:otherwise>
								</xsl:choose>
							</th>
						</tr>
					</xsl:when>
					<xsl:otherwise>
						<tr>
							<td class="definitionNameTD" >
                                <xsl:choose>
                                    <xsl:when test="name/@href">
                                        <a href="{name/@href}"><xsl:value-of select="name" /></a>
                                    </xsl:when>
                                    <xsl:otherwise>
                                        <xsl:value-of select="name" />
                                    </xsl:otherwise>
                                </xsl:choose>
							</td>
							<td class="definitionDescriptionTD">
								<xsl:value-of select="description" />
								<xsl:if test="list">
								    <xsl:call-template name="list"/>
								</xsl:if>
							</td>
						</tr>
					</xsl:otherwise>
				</xsl:choose>
			</xsl:for-each>
		</table>
	</xsl:template>	
	<xsl:template match="arguments" name="arguments" >
		<dl class="argumentsDL">
			<xsl:for-each select="arguments/argument">
				<dt id="argument_{position()}"><xsl:value-of select="name" /></dt>
				<dd id="argument_description_{position()}">
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
        <button id="addArgument">Add Argument...</button>
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