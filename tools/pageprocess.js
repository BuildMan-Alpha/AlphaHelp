/**
 * Process page data (i.e. read in the old)
 */
module.exports = function(config, data, page, callbackPage) {
    var textData = data;
    if (!textData.indexOf || !textData.substring)
        data = textData.toString('utf8');
    var complete = function(config, data, page, callbackPage) {
        var replaceAll = function(str, find, replace) {
            while (str.indexOf(find) >= 0)
                str = str.replace(find, replace);
            return str;
        };
        var haveConfigData = false;
        var ofn = replaceAll(replaceAll(page.path, '/', '_'), '\\', '_');
        var extensionStart = ofn.lastIndexOf('.');
        var extension = ofn.substring(extensionStart).toLowerCase();
        var manifestFile = config.generated + "manifest/" + ofn.substring(0, extensionStart) + ".json";
        var overrideTitle = null;
        var extractedDescription = null;
        var normalizeREF = function(srcName, ref) {
            if (ref.substr(0, 1) !== '/' && ref.substr(0, 5) !== 'http:' && ref.substr(0, 6) !== 'https:' && ref.substr(0, 11) !== 'javascript:') {
                var parts = srcName.split('/');
                var removeTail = 1;
                while (ref.substr(0, 3) === '../') {
                    ref = ref.substr(3);
                    ++removeTail;
                }
                parts.splice(parts.length - removeTail, removeTail);
                ref = parts.join('/') + '/' + ref;
            }
            return ref;
        };

        if (extension === '.md') {
            // Convert to html first
            var marked = require('marked');
            data = marked(data);
        } else if (extension === '.xml') {
            // use XSLT (if defined)
            if (config.events.extractTitle) {
                var textData = data;
                overrideTitle = config.events.extractTitle(textData);
                if (overrideTitle) {
                    page.title = overrideTitle;
                    page.metadata = { title: overrideTitle };
                }
                if (config.events.extractDescription) {
                    extractedDescription = config.events.extractDescription(textData);
                    if (extractedDescription) {
                        page.description = extractedDescription;
                    }
                }
            }
        }
        if (config.metadata) {
            var textData = data;
            var metadataAt = textData.indexOf('<!---HELPMETADATA:');
            if (metadataAt > -1) {
                if (textData.substr) {
                    var metadataJson = textData.substr(metadataAt + 18);
                    var metadataEnd = metadataJson.indexOf('--->');
                    if (metadataEnd > -1)
                        metadataJson = metadataJson.substring(0, metadataEnd);
                    try {
                        page.metadata = JSON.parse(metadataJson);
                    } catch (err) {}
                }
            }
            if (page.metadata)
                haveConfigData = true;
        }
        if (config.dependencies || config.search) {
            console.log('depends...');
            var htmlparser = require("htmlparser2");
            var deps = { href: [], images: [] };
            var plainText = "";
            var plainTextArray = [];
            var pendingPlaintextSection = null;
            var multiPage = {};
            var decodeHTMLEntities = function(text) { //https://github.com/substack/node-ent/blob/master/index.js
                console.log('decoding!');
                var ENTITIES = {
                    "amp" : "&",
                    "gt" : ">",
                    "lt" : "<",
                    "quot" : "\"",
                    "apos" : "'",
                    "AElig" : 198,
                    "Aacute" : 193,
                    "Acirc" : 194,
                    "Agrave" : 192,
                    "Aring" : 197,
                    "Atilde" : 195,
                    "Auml" : 196,
                    "Ccedil" : 199,
                    "ETH" : 208,
                    "Eacute" : 201,
                    "Ecirc" : 202,
                    "Egrave" : 200,
                    "Euml" : 203,
                    "Iacute" : 205,
                    "Icirc" : 206,
                    "Igrave" : 204,
                    "Iuml" : 207,
                    "Ntilde" : 209,
                    "Oacute" : 211,
                    "Ocirc" : 212,
                    "Ograve" : 210,
                    "Oslash" : 216,
                    "Otilde" : 213,
                    "Ouml" : 214,
                    "THORN" : 222,
                    "Uacute" : 218,
                    "Ucirc" : 219,
                    "Ugrave" : 217,
                    "Uuml" : 220,
                    "Yacute" : 221,
                    "aacute" : 225,
                    "acirc" : 226,
                    "aelig" : 230,
                    "agrave" : 224,
                    "aring" : 229,
                    "atilde" : 227,
                    "auml" : 228,
                    "ccedil" : 231,
                    "eacute" : 233,
                    "ecirc" : 234,
                    "egrave" : 232,
                    "eth" : 240,
                    "euml" : 235,
                    "iacute" : 237,
                    "icirc" : 238,
                    "igrave" : 236,
                    "iuml" : 239,
                    "ntilde" : 241,
                    "oacute" : 243,
                    "ocirc" : 244,
                    "ograve" : 242,
                    "oslash" : 248,
                    "otilde" : 245,
                    "ouml" : 246,
                    "szlig" : 223,
                    "thorn" : 254,
                    "uacute" : 250,
                    "ucirc" : 251,
                    "ugrave" : 249,
                    "uuml" : 252,
                    "yacute" : 253,
                    "yuml" : 255,
                    "copy" : 169,
                    "reg" : 174,
                    "nbsp" : 160,
                    "iexcl" : 161,
                    "cent" : 162,
                    "pound" : 163,
                    "curren" : 164,
                    "yen" : 165,
                    "brvbar" : 166,
                    "sect" : 167,
                    "uml" : 168,
                    "ordf" : 170,
                    "laquo" : 171,
                    "not" : 172,
                    "shy" : 173,
                    "macr" : 175,
                    "deg" : 176,
                    "plusmn" : 177,
                    "sup1" : 185,
                    "sup2" : 178,
                    "sup3" : 179,
                    "acute" : 180,
                    "micro" : 181,
                    "para" : 182,
                    "middot" : 183,
                    "cedil" : 184,
                    "ordm" : 186,
                    "raquo" : 187,
                    "frac14" : 188,
                    "frac12" : 189,
                    "frac34" : 190,
                    "iquest" : 191,
                    "times" : 215,
                    "divide" : 247,
                    "OElig;" : 338,
                    "oelig;" : 339,
                    "Scaron;" : 352,
                    "scaron;" : 353,
                    "Yuml;" : 376,
                    "fnof;" : 402,
                    "circ;" : 710,
                    "tilde;" : 732,
                    "Alpha;" : 913,
                    "Beta;" : 914,
                    "Gamma;" : 915,
                    "Delta;" : 916,
                    "Epsilon;" : 917,
                    "Zeta;" : 918,
                    "Eta;" : 919,
                    "Theta;" : 920,
                    "Iota;" : 921,
                    "Kappa;" : 922,
                    "Lambda;" : 923,
                    "Mu;" : 924,
                    "Nu;" : 925,
                    "Xi;" : 926,
                    "Omicron;" : 927,
                    "Pi;" : 928,
                    "Rho;" : 929,
                    "Sigma;" : 931,
                    "Tau;" : 932,
                    "Upsilon;" : 933,
                    "Phi;" : 934,
                    "Chi;" : 935,
                    "Psi;" : 936,
                    "Omega;" : 937,
                    "alpha;" : 945,
                    "beta;" : 946,
                    "gamma;" : 947,
                    "delta;" : 948,
                    "epsilon;" : 949,
                    "zeta;" : 950,
                    "eta;" : 951,
                    "theta;" : 952,
                    "iota;" : 953,
                    "kappa;" : 954,
                    "lambda;" : 955,
                    "mu;" : 956,
                    "nu;" : 957,
                    "xi;" : 958,
                    "omicron;" : 959,
                    "pi;" : 960,
                    "rho;" : 961,
                    "sigmaf;" : 962,
                    "sigma;" : 963,
                    "tau;" : 964,
                    "upsilon;" : 965,
                    "phi;" : 966,
                    "chi;" : 967,
                    "psi;" : 968,
                    "omega;" : 969,
                    "thetasym;" : 977,
                    "upsih;" : 978,
                    "piv;" : 982,
                    "ensp;" : 8194,
                    "emsp;" : 8195,
                    "thinsp;" : 8201,
                    "zwnj;" : 8204,
                    "zwj;" : 8205,
                    "lrm;" : 8206,
                    "rlm;" : 8207,
                    "ndash;" : 8211,
                    "mdash;" : 8212,
                    "lsquo;" : 8216,
                    "rsquo;" : 8217,
                    "sbquo;" : 8218,
                    "ldquo;" : 8220,
                    "rdquo;" : 8221,
                    "bdquo;" : 8222,
                    "dagger;" : 8224,
                    "Dagger;" : 8225,
                    "bull;" : 8226,
                    "hellip;" : 8230,
                    "permil;" : 8240,
                    "prime;" : 8242,
                    "Prime;" : 8243,
                    "lsaquo;" : 8249,
                    "rsaquo;" : 8250,
                    "oline;" : 8254,
                    "frasl;" : 8260,
                    "euro;" : 8364,
                    "image;" : 8465,
                    "weierp;" : 8472,
                    "real;" : 8476,
                    "trade;" : 8482,
                    "alefsym;" : 8501,
                    "larr;" : 8592,
                    "uarr;" : 8593,
                    "rarr;" : 8594,
                    "darr;" : 8595,
                    "harr;" : 8596,
                    "crarr;" : 8629,
                    "lArr;" : 8656,
                    "uArr;" : 8657,
                    "rArr;" : 8658,
                    "dArr;" : 8659,
                    "hArr;" : 8660,
                    "forall;" : 8704,
                    "part;" : 8706,
                    "exist;" : 8707,
                    "empty;" : 8709,
                    "nabla;" : 8711,
                    "isin;" : 8712,
                    "notin;" : 8713,
                    "ni;" : 8715,
                    "prod;" : 8719,
                    "sum;" : 8721,
                    "minus;" : 8722,
                    "lowast;" : 8727,
                    "radic;" : 8730,
                    "prop;" : 8733,
                    "infin;" : 8734,
                    "ang;" : 8736,
                    "and;" : 8743,
                    "or;" : 8744,
                    "cap;" : 8745,
                    "cup;" : 8746,
                    "int;" : 8747,
                    "there4;" : 8756,
                    "sim;" : 8764,
                    "cong;" : 8773,
                    "asymp;" : 8776,
                    "ne;" : 8800,
                    "equiv;" : 8801,
                    "le;" : 8804,
                    "ge;" : 8805,
                    "sub;" : 8834,
                    "sup;" : 8835,
                    "nsub;" : 8836,
                    "sube;" : 8838,
                    "supe;" : 8839,
                    "oplus;" : 8853,
                    "otimes;" : 8855,
                    "perp;" : 8869,
                    "sdot;" : 8901,
                    "lceil;" : 8968,
                    "rceil;" : 8969,
                    "lfloor;" : 8970,
                    "rfloor;" : 8971,
                    "lang;" : 9001,
                    "rang;" : 9002,
                    "loz;" : 9674,
                    "spades;" : 9824,
                    "clubs;" : 9827,
                    "hearts;" : 9829,
                    "diams;" : 9830
                  }

                var s = text;
                s = s.replace(/&#(\d+);?/g, function (_, code) {
                  return String.fromCharCode(code);
                })
                .replace(/&#[xX]([A-Fa-f0-9]+);?/g, function (_, hex) {
                  return String.fromCharCode(parseInt(hex, 16));
                })
                .replace(/&([^;\W]+;?)/g, function (m, e) {
                  var ee = e.replace(/;$/, '');
                  var target = ENTITIES[e] || (e.match(/;$/) && ENTITIES[ee]);
            
                  if (typeof target === 'number') {
                    return String.fromCharCode(target);
                  }
                  else if (typeof target === 'string') {
                    return target;
                  }
                  else {
                    return m;
                  }
                })
            
                return s;
            };

            var divDepth = 0;
            var tocDiv = -1;
            var tocDepth = -1;
            var tocHash = null;
            var childBranch = null;
            var childFlattenValue = null;
            var tocAbsolutePath = null;
            var subTOC = null;
            var tocStack = [];
            var checkForMerge = [];
            var lastText = null;
            var tagH1 = null;
            var tagTitle = null;
            var inStyleOrScript = 0;
            var findInToc = function(tocItem, name) {
                var i;
                for (i = 0; i < tocItem.length; ++i) {
                    if (tocItem[i].hash && tocItem[i].hash === name)
                        return tocItem[i];
                    if (tocItem[i].children) {
                        var result = findInToc(tocItem[i].children, name);
                        if (result)
                            return result;
                    }
                }
                return null;
            };
            var pathInToc = function(tocItem, name) {
                var i;
                for (i = 0; i < tocItem.length; ++i) {
                    if (tocItem[i].hash && tocItem[i].hash === name)
                        return tocItem[i].title;
                    if (tocItem[i].children) {
                        var result = pathInToc(tocItem[i].children, name);
                        if (result)
                            return tocItem[i].title + " / " + result;
                    }
                }
                return null;
            }
            var parser = new htmlparser.Parser({
                onopentag: function(name, attribs) {
                    if (name === "a") {
                        if (attribs.href) {
                            if (attribs.href.substring(0, 1) === '#') {
                                if (tocDepth >= 0) {
                                    if (attribs.href) {
                                        tocHash = attribs.href.substring(1);
                                    }
                                }
                            } else if (attribs.href.substring(0, 1) === '/') {
                                tocAbsolutePath = attribs.href;
                            } else if (attribs.href.substr(0, 11) !== 'javascript:') {
                                deps.href.push(normalizeREF(page.path, attribs.href));
                            }
                            if (attribs.helpserver_folder) {
                                childBranch = attribs.helpserver_folder;
                                if (attribs.helpserver_flatten) {
                                    childFlattenValue = parseInt(attribs.helpserver_flatten);
                                    if (childFlattenValue === NaN)
                                        childFlattenValue = null;
                                }
                            }
                        }
                        if (subTOC) {
                            if (attribs.name) {
                                var item = findInToc(subTOC, attribs.name);
                                if (item && item.hash) {
                                    if (plainTextArray.length > 0) {
                                        plainText = plainTextArray.join("") + plainText;
                                        plainTextArray = [];
                                    }
                                    if (pendingPlaintextSection && plainText.length > 0) {
                                        multiPage[pendingPlaintextSection] = plainText;
                                    }
                                    plainText = "";
                                    pendingPlaintextSection = item.hash;
                                }
                            }
                        }
                    } else if (name === "img" && attribs.src) {
                        deps.images.push(normalizeREF(page.path, attribs.src));
                    } else if (name === "div") {
                        if (attribs.class && attribs.class === 'helpserver_toc') {
                            tocDiv = divDepth;
                        }
                        ++divDepth;
                    } else if (name === "ul") {
                        if (tocDiv >= 0) {
                            ++tocDepth;
                            if (tocStack.length <= tocDepth)
                                tocStack.push([]);
                            else
                                tocStack[tocDepth] = [];
                        }
                    } else if (name === "style" || name === "script") {
                        ++inStyleOrScript;
                    }
                },
                ontext: function(text) {
                    console.log('ontext');
                    text = decodeHTMLEntities(text);
                    lastText = text;
                    if (config.search && inStyleOrScript === 0) {
                        plainText += text;
                        if (plainText.length > 8000) {
                            plainTextArray.push(plainText);
                            plainText = "";
                        }
                    }
                    if (tocHash || childBranch) {
                        if (tocHash && childBranch) {
                            if (childFlattenValue && childFlattenValue > 0)
                                tocStack[tocDepth].push({ title: text, hash: tocHash, childBranch: childBranch, childFlatten: childFlattenValue });
                            else
                                tocStack[tocDepth].push({ title: text, hash: tocHash, childBranch: childBranch });
                        } else if (childBranch) {
                            if (tocAbsolutePath) {
                                if (childFlattenValue && childFlattenValue > 0)
                                    tocStack[tocDepth].push({ title: text, path: tocAbsolutePath, childBranch: childBranch, childFlatten: childFlattenValue });
                                else
                                    tocStack[tocDepth].push({ title: text, path: tocAbsolutePath, childBranch: childBranch });
                            } else {
                                if (childFlattenValue && childFlattenValue > 0)
                                    tocStack[tocDepth].push({ title: text, childBranch: childBranch, childFlatten: childFlattenValue });
                                else
                                    tocStack[tocDepth].push({ title: text, childBranch: childBranch });
                            }
                        } else {
                            tocStack[tocDepth].push({ title: text, hash: tocHash });
                        }
                        tocHash = null;
                        tocAbsolutePath = null;
                        childBranch = null;
                        childFlattenValue = null;
                    } else if (tocAbsolutePath && tocDepth >= 0) {
                        if (childBranch) {
                            if (childFlattenValue && childFlattenValue > 0)
                                tocStack[tocDepth].push({ title: text, path: tocAbsolutePath, childBranch: childBranch, childFlatten: childFlattenValue });
                            else
                                tocStack[tocDepth].push({ title: text, path: tocAbsolutePath, childBranch: childBranch });
                        } else {
                            var pageRefNode = { title: text, path: tocAbsolutePath };
                            tocStack[tocDepth].push(pageRefNode);
                            checkForMerge.push(pageRefNode);
                        }
                        tocAbsolutePath = null;
                        childBranch = null;
                        childFlattenValue = null;
                    }
                },
                onclosetag: function(name) {
                    if (name === "div") {
                        --divDepth;
                        if (tocDiv === divDepth) {
                            tocDiv = -1;
                        }
                    } else if (name === "ul") {
                        if (tocDiv >= 0) {
                            if (tocDepth > 0) {
                                var parentTree = tocStack[tocDepth - 1];
                                if (parentTree.length > 0) {
                                    parentTree[parentTree.length - 1].children = tocStack[tocDepth];
                                }
                            } else {
                                subTOC = tocStack[0];
                            }
                            --tocDepth;
                        }
                    } else if (name === "title") {
                        if (!tagTitle && extension !== '.xml') {
                            tagTitle = lastText;
                        }
                    } else if (name === "h1") {
                        if (!tagH1) {
                            tagH1 = lastText;
                        }
                    } else if (name === "style" || name === "script") {
                        --inStyleOrScript;
                    }
                }
            });
            parser.write(data);
            parser.end();

            // If 'chunks' array was allocated (for big buffers - flush the content)
            if (plainTextArray.length > 0) {
                plainText = plainTextArray.join("") + plainText;
                plainTextArray = [];
            }

            if (pendingPlaintextSection && plainText.length > 0) {
                multiPage[pendingPlaintextSection] = plainText;
            }
            if (config.dependencies) {
                page.dependencies = deps;
                if (deps.href.length > 0 || deps.images.length > 0)
                    haveConfigData = true;
            }
            // Add a table of contents to the node....
            if (subTOC) {
                page.toc = subTOC;
                haveConfigData = true;
            }

            if (!tagTitle && page.title === "index") {
                tagTitle = tagH1;
            }
            if (tagTitle) {
                overrideTitle = tagTitle;
                if (overrideTitle) {
                    page.title = overrideTitle;
                    page.metadata = { title: overrideTitle };
                }
            }
            if (extractedDescription) {
                page.description = extractedDescription;
            }
            var fs = require('fs');
            var commitPageManifest = function() {
                if (config.search) {
                    if (pendingPlaintextSection) {
                        var plainTextPath = config.generated + "plaintext/";
                        var ofnBase = ofn.replace(".html", "");
                        var countDown = 0;
                        var hashList = "#HELPSERVER-TOC-ENTRY";
                        for (var prop in multiPage) {
                            hashList += "\n" + prop + "\t" + pathInToc(subTOC, prop);
                            ++countDown;
                        }
                        fs.writeFile(plainTextPath + ofnBase + ".txt", hashList, function(err) {
                            for (var prop in multiPage) {
                                fs.writeFile(plainTextPath + ofnBase + "__" + prop + ".txt", multiPage[prop].replace(/\s+/g, ' '), function(err) {
                                    --countDown;
                                    if (countDown === 0) {
                                        if (haveConfigData) {
                                            fs.writeFile(manifestFile, JSON.stringify(page, null, "  "), function(err2) {
                                                callbackPage(err, ofn);
                                            });
                                        } else {
                                            callbackPage(err, ofn);
                                        }
                                    }
                                });
                            }
                        });
                    } else {
                        var plainTextPath = config.generated + "plaintext/";
                        ofn = ofn.replace(".html", ".txt");
                        plainText = plainText.replace(/\s+/g, ' ');
                        fs.writeFile(plainTextPath + ofn, plainText, function(err) {
                            if (haveConfigData) {
                                fs.writeFile(manifestFile, JSON.stringify(page, null, "  "), function(err2) {
                                    callbackPage(err, ofn);
                                });
                            } else {
                                callbackPage(err, ofn);
                            }
                        });
                    }
                } else {
                    if (haveConfigData) {
                        fs.writeFile(manifestFile, JSON.stringify(page, null, "  "), function(err) {
                            callbackPage(err, "");
                        });
                    } else {
                        callbackPage(null, "");
                    }
                }
            };
            if (checkForMerge.length > 0) {
                // Look through all the href nodes & determine if any of the pages have SUBTOCS, and merge them 
                var async = require('async');
                async.eachSeries(checkForMerge, function(checkNode, callbackLoop) {
                    if (!checkNode.children) {
                        var childofn = replaceAll(replaceAll(checkNode.path, '/', '_'), '\\', '_');
                        var childextensionStart = childofn.lastIndexOf('.');
                        var childmanifestFile = config.generated + "manifest/" + childofn.substring(0, childextensionStart) + ".json";
                        fs.readFile(childmanifestFile, "utf8", function(childerr, manifestdata) {
                            // Merge in child subTOC entries
                            if (!childerr) {
                                var manifestObj = JSON.parse(manifestdata);
                                if (manifestObj.toc) {
                                    checkNode.children = manifestObj.toc;
                                    var propogatePath = function(kids, kidspath) {
                                        var i;
                                        for (i = 0; i < kids.length; ++i) {
                                            if (!kids[i].path)
                                                kids[i].path = kidspath;
                                            if (kids[i].children) {
                                                propogatePath(kids[i].children, kidspath);
                                            }
                                        }
                                    };
                                    propogatePath(checkNode.children, checkNode.path);
                                }
                            }
                            callbackLoop();
                        });
                    } else {
                        callbackLoop();
                    }
                }, function() {
                    commitPageManifest();
                });
            } else {
                commitPageManifest();
            }
        } else if (haveConfigData) {
            fs.writeFile(manifestFile, JSON.stringify(page, null, "  "), function(err) {
                callbackPage(err, "");
            });
        } else {
            callbackPage(null, "");
        }
    };

    if (config.events.processForIndex) {
        config.events.processForIndex(config, data, page, callbackPage, complete);
    } else {
        complete(config, data, page, callbackPage);
    }
};