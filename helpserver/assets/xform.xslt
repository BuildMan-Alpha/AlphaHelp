<xsl:stylesheet xmlns:xsl="http://www.w3.org/1999/XSL/Transform" version="1.0">
	<xsl:template match="/">
		<xsl:for-each select="page">
			<p >
				<p class="A3Function"><xsl:value-of select="topic" /></p>
			</p>
			<xsl:if test="syntax">
				<p class="A5">Syntax</p>  
				<xsl:value-of select="syntax" />
			</xsl:if>
			<ul>
			<xsl:for-each select="arguments/argument">
				<li> <xsl:value-of select="name"/>
					<ul>
						<xsl:choose>
							<xsl:when test="content">
								<xsl:value-of select="content" disable-output-escaping="yes"/>
							</xsl:when>						
							<xsl:when test="description">
								<xsl:value-of select="description"/>
							</xsl:when>	
						</xsl:choose>				
					</ul>
				</li>
			</xsl:for-each>
			</ul>
			<xsl:choose>
				<xsl:when test="content">
					<p class="A5">Description</p> <p><xsl:value-of select="content" disable-output-escaping="yes"/> </p>
				</xsl:when>						
				<xsl:when test="description">
					<p class="A5">Description</p> <p><xsl:value-of select="description"/> </p>
				</xsl:when>
			</xsl:choose>
			<xsl:if test="example">
			     <b class="A5">Example</b> <pre class="codeTable"><xsl:value-of select="example" /></pre>
			</xsl:if>
			<xsl:if test="sections">
				<xsl:for-each select="sections/section">
					<xsl:choose>
						<xsl:when test="content">
							<p ><xsl:value-of select="content" disable-output-escaping="yes"/></p>
						</xsl:when>						
						<xsl:when test="description">
							<p ><xsl:value-of select="description"/></p>
						</xsl:when>
					</xsl:choose>
					<xsl:if test="example">
						<pre class="codeTable"><xsl:value-of select="example" /></pre>
					</xsl:if>
				</xsl:for-each>
			</xsl:if>			
			<xsl:if test="methods">
				<p class="A5">Methods</p>
				<ul>
				<xsl:for-each select="methods/method">
					<li>
						<xsl:value-of select="name" />
						<ul>
							<xsl:value-of select="description" />
							<p>
								<a onclick="helpServer.navigateClosestTopic(this.innerText || this.text)" ><xsl:value-of select="ref" /></a>
							</p>
						</ul>							
					</li>
				</xsl:for-each>
				</ul>
			</xsl:if>
			<xsl:if test="video">
				<xsl:for-each select="video">
					<li><a xsl:use-attribute-sets="href-link"><xsl:value-of select="name" /></a></li>
				</xsl:for-each>
			</xsl:if>
			<xsl:if test="videos">
				<xsl:for-each select="videos/video">
					<li><a xsl:use-attribute-sets="href-link"><xsl:value-of select="name" /></a></li>
				</xsl:for-each>
			</xsl:if>
			<xsl:if test="see">
			<p class="A5">See Also</p>
			<ul>
			<xsl:for-each select="see/ref">
				<li><a onclick="helpServer.navigateClosestTopic(this.innerText || this.text)" ><xsl:value-of select="." /></a></li>
			</xsl:for-each>
			</ul>
			</xsl:if>
		</xsl:for-each>
	</xsl:template>
	<xsl:attribute-set name="href-link">
		<xsl:attribute name="href">
			<xsl:value-of select="link"/>
		</xsl:attribute>
	</xsl:attribute-set>	
</xsl:stylesheet>
