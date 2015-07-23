package main

import (
	"golang.org/x/net/html"
	"strings"
    "io/ioutil"
	"fmt"
	"os"
	"path"
	"bytes"	
)

func Exists(name string) bool {
    if _, err := os.Stat(name); err != nil {
    if os.IsNotExist(err) {
                return false
            }
    }
    return true
}

func processHtmlFile(infile,outfile string) {	
    dat, err := ioutil.ReadFile(infile);
    if err != nil {
         panic(err);
    }
    origSrc := string(dat);
	doc, err := html.Parse(strings.NewReader(origSrc));
    if err != nil {
         panic(err);
    }
	var srcList []string;
	var replaceTOC = false;
	var insideBody = false;
	var embeddStyle = "";
	
	// Record all the image tags...
	var f func(*html.Node);
	f = func(n *html.Node) {
		if n.Type == html.ElementNode {
			if n.Data == "img" {
				for _, a := range n.Attr {
					if a.Key == "src" {
						if !strings.Contains(a.Val,":") && !strings.Contains(a.Val,"/") && !strings.Contains(a.Val,"\\") {
							srcList = append(srcList,a.Val);
							break
						}
					}
				}
			} else if n.Data == "div" {
				for _, a := range n.Attr {
					if a.Key == "class" {
						if a.Val == "toc" {
							// replace with helpserver_toc
							replaceTOC = true;						
						}
					}
				}
			} else if n.Data == "style" {
				if !insideBody {
					embeddStyle = strings.Trim(n.FirstChild.Data," ");
				}
			} else if n.Data == "body" {
				insideBody = true;
			}
		}
		for c := n.FirstChild; c != nil; c = c.NextSibling {
			f(c)
		}
	}
	f(doc);
	newSrc := origSrc;
	if replaceTOC {
		newSrc = strings.Replace(newSrc,`class="toc"`,`class="helpserver_toc"`,-1);
	}
	if embeddStyle != "" {
		styleStartAt := strings.Index(newSrc, "<style");		
		styleEndStartAt := strings.Index(newSrc, "</style>");
		bodyStartAt := strings.Index(newSrc, "<body");
		if bodyStartAt > styleEndStartAt && styleStartAt > 0 && styleEndStartAt > styleStartAt {
			styleEndStartAt += 8;
			bodyTagEndAt := strings.Index( newSrc[bodyStartAt:] , ">" );
			if( bodyTagEndAt > 0 ) {
				bodyStartAt += bodyTagEndAt+1;
				newSrc = newSrc[:styleStartAt]+newSrc[styleEndStartAt:bodyStartAt]+"__EMBEDDEDSTYLELOCATION__"+newSrc[bodyStartAt:];				
				newSrc = strings.Replace(newSrc,"__EMBEDDEDSTYLELOCATION__","<style>"+embeddStyle+"</style>",-1);
			}
		}
	}
	for _ , v := range srcList {
	      search := `"`+v+`"`;
		  replace := `"images/`+v+`"`;
		  newSrc = strings.Replace(newSrc,search,replace,-1);
	}
	
    a := []byte(newSrc);
	if Exists(outfile) {
	    dat, err := ioutil.ReadFile(outfile);
	    if err != nil {
	         panic(err);
	    }
		orig := string(dat);
		// Preserve metadata in the target (if it is defined)
		metadataStartAt := strings.Index(origSrc, "<!---HELPMETADATA:");
		if metadataStartAt < 0 {
			metadataStart := strings.Index(orig, "<!---HELPMETADATA:");
			if metadataStart > 0 {
				metadataTag := orig[metadataStart:];
				metadataEnd := strings.Index(metadataTag, "--->");
				if metadataEnd > 0 {
					metadataEnd += 4;
					metadataTag = metadataTag[:metadataEnd];
					// Lets insert metadata into document...
					lastTagPos := strings.LastIndex(newSrc,"</body");
					if lastTagPos < 0 {
						lastTagPos = strings.LastIndex(newSrc,"</");
					}
					if lastTagPos < 0 {
						newSrc += metadataTag;
					} else {
						prefix := newSrc[:lastTagPos];
						suffix := newSrc[lastTagPos:];
						newSrc = prefix + metadataTag + "\r\n" + suffix;
					}	
					newSrc = strings.Trim(newSrc," ");
			    	a = []byte(newSrc);
				}
			}
		}
		if bytes.Equal(a,dat)  {
			fmt.Println("\tFile "+outfile+" unchanged, nothing written.");
			return;
		}
		
	}		
	fmt.Println("\tConverted "+infile+" to  Documentation "+outfile);
	err = ioutil.WriteFile(outfile, a, 0644);
	// Make sure images exist..
	if len(srcList) > 0  {
		infile = strings.Replace(infile,"\\","/",-1);
		outfile = strings.Replace(outfile,"\\","/",-1);
		srcPath := path.Dir(infile);
		srcPath += "/"			
		basePath := path.Dir(outfile);
		basePath += "/images";
		if !Exists(basePath) {
			os.Mkdir(basePath,0777);
		}		
		basePath += "/";
		for _ , v := range srcList {			
			srcFile := srcPath;
			srcFile += v;
		    datSrc, err := ioutil.ReadFile(srcFile);
		    if err != nil {
		         panic(err);
		    }
			imageFile := basePath;
			imageFile += v;
			if Exists(imageFile) {
			    datDst, err := ioutil.ReadFile(imageFile);
			    if err != nil {
			         panic(err);
			    }
				if bytes.Equal(datSrc,datDst)  {
					continue;
				}
				fmt.Println("Update image file "+imageFile);					
			} else {
				fmt.Println("Created new image file "+imageFile);
			}
			ioutil.WriteFile(imageFile,datSrc,0644);			
		}
	}
}

func main() {	
	if len(os.Args) > 2  {	
		processHtmlFile(os.Args[1],os.Args[2]);		
	} else {
	    fmt.Println("publishtodoc - usage");
	    fmt.Println("\tpublishtodoc <input> <output>");
	}
}