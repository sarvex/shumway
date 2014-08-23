/* -*- Mode: js; js-indent-level: 2; indent-tabs-mode: nil; tab-width: 2 -*- */
/* vim: set shiftwidth=2 tabstop=2 autoindent cindent expandtab: */
/*
 * Copyright 2013 Mozilla Foundation
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/// <reference path='references.ts'/>
module Shumway.SWF.Parser {
  import DataBuffer = Shumway.ArrayUtilities.DataBuffer;

  /*
  function defineShape($bytes, $stream, output, swfVersion, tagCode) {
    output || (output = {});
    output.id = stream.readUi16();
    var lineBounds = output.lineBounds = RECT.FromStream(stream);
    var isMorph = output.isMorph = tagCode === 46 || tagCode === 84;
    if (isMorph) {
      var lineBoundsMorph = output.lineBoundsMorph = {};
      lineBoundsMorph = RECT.FromStream(stream);
    }
    var canHaveStrokes = output.canHaveStrokes = tagCode === 83 || tagCode === 84;
    if (canHaveStrokes) {
      var fillBounds = output.fillBounds = {};
      fillBounds = RECT.FromStream(stream);
      if (isMorph) {
        var fillBoundsMorph = output.fillBoundsMorph = {};
        fillBoundsMorph = RECT.FromStream(stream);
      }
      output.flags = stream.readUi8();
    }
    if (isMorph) {
      output.offsetMorph = stream.readUi32();
      morphShapeWithStyle($bytes, $stream, output, swfVersion, tagCode, isMorph, canHaveStrokes);
    } else {
      shapeWithStyle($bytes, $stream, output, swfVersion, tagCode, isMorph, canHaveStrokes);
    }
    return output;
  }
  */

  export enum PlaceFlags {
    Reserved          = 0x800,
    OpaqueBackground  = 0x400,
    HasVisible        = 0x200,
    HasImage          = 0x100,
    HasClassName      = 0x800,
    HasCacheAsBitmap  = 0x400,
    HasBlendMode      = 0x200,
    HasFilterList     = 0x100,
    HasClipActions    = 0x080,
    HasClipDepth      = 0x040,
    HasName           = 0x020,
    HasRatio          = 0x010,
    HasColorTransform = 0x008,
    HasMatrix         = 0x004,
    HasCharacter      = 0x002,
    Move              = 0x001
  }

  /**
   * These are probably not in the right order.
   */
  export enum ClipEventFlags {
    ClipEventKeyUp          = 0x00001,
    ClipEventKeyDown        = 0x00002,
    ClipEventMouseUp        = 0x00004,
    ClipEventMouseDown      = 0x00008,
    ClipEventMouseMove      = 0x00010,
    ClipEventUnload         = 0x00020,
    ClipEventEnterFrame     = 0x00040,
    ClipEventLoad           = 0x00080,
    ClipEventDragOver       = 0x00100,
    ClipEventRollOut        = 0x00200,
    ClipEventRollOver       = 0x00400,
    ClipEventReleaseOutside = 0x00800,
    ClipEventRelease        = 0x01000,
    ClipEventPress          = 0x02000,
    ClipEventInitialize     = 0x04000,
    ClipEventData           = 0x08000,
    Reserved                = 0x10000,
    ClipEventConstruct      = 0x20000
  }
  
  export class PlaceObject {
    flags: PlaceFlags;
    symbolId: number;
    depth: number;
    className: string;
    matrix: MATRIX;
    cxform: CXFORM;
    ratio: number;
    name: string;
    clipDepth: number;
    filters: FILTER [];
    blendMode: number;
    bitmapCache: number;
    clipActions: CLIPACTIONS;
    backgroundColor: number;
    visible: number;

    static FromStream(stream: DataBuffer, placeObject: PlaceObject, context: SWFParserContext): PlaceObject {
      placeObject || (placeObject = new PlaceObject());
      var flags: PlaceFlags;
      if (context.tagCode > SWFTag.PLACE_OBJECT) {
        flags = placeObject.flags = context.tagCode > SWFTag.PLACE_OBJECT2 ? stream.readUi16() : stream.readUi8();
        placeObject.depth = stream.readUi16();
        if (flags & PlaceFlags.HasClassName) {
          placeObject.className = stream.readString(0);
        }
        if (flags & PlaceFlags.HasCharacter) {
          placeObject.symbolId = stream.readUi16();
        }
        if (flags & PlaceFlags.HasMatrix) {
          placeObject.matrix = MATRIX.FromStream(stream);
        }
        if (flags & PlaceFlags.HasColorTransform) {
          placeObject.cxform = CXFORM.FromStream(stream, null, context.tagCode > SWFTag.PLACE_OBJECT);
        }
        if (flags & PlaceFlags.HasRatio) {
          placeObject.ratio = stream.readUi16();
        }
        if (flags & PlaceFlags.HasName) {
          placeObject.name = stream.readString(0);
        }
        if (flags & PlaceFlags.HasClipDepth) {
          placeObject.clipDepth = stream.readUi16();
        }
        if (flags & PlaceFlags.HasFilterList) {
          var numberOfFilters = stream.readUi8();
          placeObject.filters = [];
          while (numberOfFilters--) {
            placeObject.filters.push(FILTER.FromStream(stream));
          }
        }
        if (flags & PlaceFlags.HasBlendMode) {
          placeObject.blendMode = stream.readUi8();
        }
        if (flags & PlaceFlags.HasCacheAsBitmap) {
          placeObject.bitmapCache = stream.readUi8();
        }
        if (flags & PlaceFlags.HasClipActions) {
          placeObject.clipActions = CLIPACTIONS.FromStream(stream, null, context);
        }
        if (flags & PlaceFlags.OpaqueBackground) {
          placeObject.backgroundColor = argb(stream);
        }
        if (flags & PlaceFlags.HasVisible) {
          placeObject.visible = stream.readUi8();
        }
      } else {
        placeObject.symbolId = stream.readUi16();
        placeObject.depth = stream.readUi16();
        placeObject.flags |= PlaceFlags.HasMatrix;
        placeObject.matrix = MATRIX.FromStream(stream);
        if (stream.remaining()) {
          placeObject.flags |= PlaceFlags.HasColorTransform;
          placeObject.cxform = CXFORM.FromStream(stream, null, false);
        }
      }
      return placeObject;
    }
  }

  /*
  function placeObject($bytes, $stream, $, swfVersion, tagCode) {
    var flags;
    $ || ($ = {});
    if (tagCode > SWFTag.PLACE_OBJECT) {
      flags = $.flags = tagCode > SWFTag.PLACE_OBJECT2 ?
                        stream.readUi16() :
                        stream.readUi8();
      $.depth = stream.readUi16();
      if (flags & PlaceFlags.HasClassName) {
        $.className = stream.readString(0);
      }
      if (flags & PlaceFlags.HasCharacter) {
        $.symbolId = stream.readUi16();
      }
      if (flags & PlaceFlags.HasMatrix) {
        var $0 = $.matrix = {};
        matrix($bytes, $stream, $0, swfVersion, tagCode);
      }
      if (flags & PlaceFlags.HasColorTransform) {
        var $1 = $.cxform = {};
        cxform($bytes, $stream, $1, swfVersion, tagCode);
      }
      if (flags & PlaceFlags.HasRatio) {
        $.ratio = stream.readUi16();
      }
      if (flags & PlaceFlags.HasName) {
        $.name = stream.readString(0);
      }
      if (flags & PlaceFlags.HasClipDepth) {
        $.clipDepth = stream.readUi16();
      }
      if (flags & PlaceFlags.HasFilterList) {
        var count = stream.readUi8();
        var $2 = $.filters = [];
        var $3 = count;
        while ($3--) {
          var $4 = {};
          anyFilter($bytes, $stream, $4, swfVersion, tagCode);
          $2.push($4);
        }
      }
      if (flags & PlaceFlags.HasBlendMode) {
        $.blendMode = stream.readUi8();
      }
      if (flags & PlaceFlags.HasCacheAsBitmap) {
        $.bmpCache = stream.readUi8();
      }
      if (flags & PlaceFlags.HasClipActions) {
        var reserved = stream.readUi16();
        if (swfVersion >= 6) {
          var allFlags = stream.readUi32();
        }
        else {
          var allFlags = stream.readUi16();
        }
        var $28 = $.events = [];
        do {
          var $29 = {};
          var eoe = events($bytes, $stream, $29, swfVersion, tagCode);
          $28.push($29);
        } while (!eoe);
      }
      if (flags & PlaceFlags.OpaqueBackground) {
        $.backgroundColor = argb($bytes, $stream);
      }
      if (flags & PlaceFlags.HasVisible) {
        $.visibility = stream.readUi8();
      }
    } else {
      $.symbolId = stream.readUi16();
      $.depth = stream.readUi16();
      $.flags |= PlaceFlags.HasMatrix;
      var $30 = $.matrix = {};
      matrix($bytes, $stream, $30, swfVersion, tagCode);
      if ($stream.remaining()) {
        $.flags |= PlaceFlags.HasColorTransform;
        var $31 = $.cxform = {};
        cxform($bytes, $stream, $31, swfVersion, tagCode);
      }
    }
    return $;
  }

  function removeObject($bytes, $stream, $, swfVersion, tagCode) {
    $ || ($ = {});
    if (tagCode === 5) {
      $.symbolId = stream.readUi16();
    }
    $.depth = stream.readUi16();
    return $;
  }

  function defineImage($bytes, $stream, $, swfVersion, tagCode) {
    var imgData;
    $ || ($ = {});
    $.id = stream.readUi16();
    if (tagCode > 21) {
      var alphaDataOffset = stream.readUi32();
      if (tagCode === 90) {
        $.deblock = stream.readFixed8();
      }
      imgData = $.imgData = readBinary($bytes, $stream, alphaDataOffset, true);
      $.alphaData = readBinary($bytes, $stream, 0, true);
    }
    else {
      imgData = $.imgData = readBinary($bytes, $stream, 0, true);
    }
    switch (imgData[0] << 8 | imgData[1]) {
      case 65496:
      case 65497:
        $.mimeType = "image/jpeg";
        break;
      case 35152:
        $.mimeType = "image/png";
        break;
      case 18249:
        $.mimeType = "image/gif";
        break;
      default:
        $.mimeType = "application/octet-stream";
    }
    if (tagCode === 6) {
      $.incomplete = 1;
    }
    return $;
  }

  function defineButton($bytes, $stream, $, swfVersion, tagCode) {
    var eob: boolean;
    $ || ($ = {});
    $.id = stream.readUi16();
    if (tagCode == 7) {
      var $0 = $.characters = [];
      do {
        var $1 = {};
        var temp = button($bytes, $stream, $1, swfVersion, tagCode);
        eob = temp.eob;
        $0.push($1);
      } while (!eob);
      $.actionsData = readBinary($bytes, $stream, 0, false);
    }
    else {
      var trackFlags = stream.readUi8();
      $.trackAsMenu = trackFlags >> 7 & 1;
      var actionOffset = stream.readUi16();
      var $28 = $.characters = [];
      do {
        var $29: any = {};
        var flags = stream.readUi8();
        var eob = $29.eob = !flags;
        if (swfVersion >= 8) {
          $29.flags = (flags >> 5 & 1 ? PlaceFlags.HasBlendMode : 0) |
                      (flags >> 4 & 1 ? PlaceFlags.HasFilterList : 0);
        }
        else {
          $29.flags = 0;
        }
        $29.stateHitTest = flags >> 3 & 1;
        $29.stateDown = flags >> 2 & 1;
        $29.stateOver = flags >> 1 & 1;
        $29.stateUp = flags & 1;
        if (!eob) {
          $29.symbolId = stream.readUi16();
          $29.depth = stream.readUi16();
          var $30 = $29.matrix = {};
          matrix($bytes, $stream, $30, swfVersion, tagCode);
          if (tagCode === 34) {
            var $31 = $29.cxform = {};
            cxform($bytes, $stream, $31, swfVersion, tagCode);
          }
          if ($29.flags & PlaceFlags.HasFilterList) {
            var count = stream.readUi8();
            var $2 = $.filters = [];
            var $3 = count;
            while ($3--) {
              var $4 = {};
              anyFilter($bytes, $stream, $4, swfVersion, tagCode);
              $2.push($4);
            }
          }
          if ($29.flags & PlaceFlags.HasBlendMode) {
            $29.blendMode = stream.readUi8();
          }
        }
        $28.push($29);
      } while (!eob);
      if (!!actionOffset) {
        var $56 = $.buttonActions = [];
        do {
          var $57 = {};
          buttonCondAction($bytes, $stream, $57, swfVersion, tagCode);
          $56.push($57);
        } while ($stream.remaining() > 0);
      }
    }
    return $;
  }

  function defineJPEGTables($bytes, $stream, $, swfVersion, tagCode) {
    $ || ($ = {});
    $.id = 0;
    $.imgData = readBinary($bytes, $stream, 0, false);
    $.mimeType = "application/octet-stream";
    return $;
  }

  function setBackgroundColor($bytes, $stream, $, swfVersion, tagCode) {
    $ || ($ = {});
    $.color = rgb($bytes, $stream);
    return $;
  }

  function defineBinaryData($bytes, $stream, $, swfVersion, tagCode) {
    $ || ($ = {});
    $.id = stream.readUi16();
    var reserved = stream.readUi32();
    $.data = readBinary($bytes, $stream, 0, false);
    return $;
  }

  function defineFont($bytes, $stream, $, swfVersion, tagCode) {
    $ || ($ = {});
    $.id = stream.readUi16();
    var firstOffset = stream.readUi16();
    var glyphCount = $.glyphCount = firstOffset / 2;
    var restOffsets = [];
    var $0 = glyphCount - 1;
    while ($0--) {
      restOffsets.push(stream.readUi16());
    }
    $.offsets = [firstOffset].concat(restOffsets);
    var $1 = $.glyphs = [];
    var $2 = glyphCount;
    while ($2--) {
      var $3 = {};
      shape($bytes, $stream, $3, swfVersion, tagCode);
      $1.push($3);
    }
    return $;
  }

  function defineLabel($bytes, $stream, $, swfVersion, tagCode) {
    var eot;
    $ || ($ = {});
    $.id = stream.readUi16();
    var $0 = $.bbox = {};
    $0 = RECT.FromStream(stream);
    var $1 = $.matrix = {};
    matrix($bytes, $stream, $1, swfVersion, tagCode);
    var glyphBits = $.glyphBits = stream.readUi8();
    var advanceBits = $.advanceBits = stream.readUi8();
    var $2 = $.records = [];
    do {
      var $3 = {};
      var temp = textRecord($bytes, $stream, $3, swfVersion, tagCode, glyphBits, advanceBits);
      eot = temp.eot;
      $2.push($3);
    } while (!eot);
    return $;
  }

  function doAction($bytes, $stream, $, swfVersion, tagCode) {
    $ || ($ = {});
    if (tagCode === 59) {
      $.spriteId = stream.readUi16();
    }
    $.actionsData = readBinary($bytes, $stream, 0, false);
    return $;
  }

  function defineSound($bytes, $stream, $, swfVersion, tagCode) {
    $ || ($ = {});
    $.id = stream.readUi16();
    var soundFlags = stream.readUi8();
    $.soundFormat = soundFlags >> 4 & 15;
    $.soundRate = soundFlags >> 2 & 3;
    $.soundSize = soundFlags >> 1 & 1;
    $.soundType = soundFlags & 1;
    $.samplesCount = stream.readUi32();
    $.soundData = readBinary($bytes, $stream, 0, false);
    return $;
  }

  function startSound($bytes, $stream, $, swfVersion, tagCode) {
    $ || ($ = {});
    if (tagCode == 15) {
      $.soundId = stream.readUi16();
    }
    if (tagCode == 89) {
      $.soundClassName = stream.readString(0);
    }
    var $0 = $.soundInfo = {};
    soundInfo($bytes, $stream, $0, swfVersion, tagCode);
    return $;
  }

  function soundStreamHead($bytes, $stream, $, swfVersion, tagCode) {
    $ || ($ = {});
    var playbackFlags = stream.readUi8();
    $.playbackRate = playbackFlags >> 2 & 3;
    $.playbackSize = playbackFlags >> 1 & 1;
    $.playbackType = playbackFlags & 1;
    var streamFlags = stream.readUi8();
    var streamCompression = $.streamCompression = streamFlags >> 4 & 15;
    $.streamRate = streamFlags >> 2 & 3;
    $.streamSize = streamFlags >> 1 & 1;
    $.streamType = streamFlags & 1;
    $.samplesCount = stream.readUi32();
    if (streamCompression == 2) {
      $.latencySeek = readSi16($bytes, $stream);
    }
    return $;
  }

  function soundStreamBlock($bytes, $stream, $, swfVersion, tagCode) {
    $ || ($ = {});
    $.data = readBinary($bytes, $stream, 0, false);
    return $;
  }

  function defineBitmap($bytes, $stream, $, swfVersion, tagCode) {
    $ || ($ = {});
    $.id = stream.readUi16();
    var format = $.format = stream.readUi8();
    $.width = stream.readUi16();
    $.height = stream.readUi16();
    $.hasAlpha = tagCode === 36;
    if (format === 3) {
      $.colorTableSize = stream.readUi8();
    }
    $.bmpData = readBinary($bytes, $stream, 0, false);
    return $;
  }

  function defineText($bytes, $stream, $, swfVersion, tagCode) {
    $ || ($ = {});
    $.id = stream.readUi16();
    var $0 = $.bbox = {};
    $0 = RECT.FromStream(stream);
    var flags = stream.readUi16();
    var hasText = $.hasText = flags >> 7 & 1;
    $.wordWrap = flags >> 6 & 1;
    $.multiline = flags >> 5 & 1;
    $.password = flags >> 4 & 1;
    $.readonly = flags >> 3 & 1;
    var hasColor = $.hasColor = flags >> 2 & 1;
    var hasMaxLength = $.hasMaxLength = flags >> 1 & 1;
    var hasFont = $.hasFont = flags & 1;
    var hasFontClass = $.hasFontClass = flags >> 15 & 1;
    $.autoSize = flags >> 14 & 1;
    var hasLayout = $.hasLayout = flags >> 13 & 1;
    $.noSelect = flags >> 12 & 1;
    $.border = flags >> 11 & 1;
    $.wasStatic = flags >> 10 & 1;
    $.html = flags >> 9 & 1;
    $.useOutlines = flags >> 8 & 1;
    if (hasFont) {
      $.fontId = stream.readUi16();
    }
    if (hasFontClass) {
      $.fontClass = stream.readString(0);
    }
    if (hasFont) {
      $.fontHeight = stream.readUi16();
    }
    if (hasColor) {
      $.color = rgba(stream);
    }
    if (hasMaxLength) {
      $.maxLength = stream.readUi16();
    }
    if (hasLayout) {
      $.align = stream.readUi8();
      $.leftMargin = stream.readUi16();
      $.rightMargin = stream.readUi16();
      $.indent = readSi16($bytes, $stream);
      $.leading = readSi16($bytes, $stream);
    }
    $.variableName = stream.readString(0);
    if (hasText) {
      $.initialText = stream.readString(0);
    }
    return $;
  }

  function frameLabel($bytes, $stream, $, swfVersion, tagCode) {
    $ || ($ = {});
    $.name = stream.readString(0);
    return $;
  }

  function defineFont2($bytes, $stream, $, swfVersion, tagCode) {
    $ || ($ = {});
    $.id = stream.readUi16();
    var hasLayout = $.hasLayout = stream.readUb(1);
    var reserved: any;
    if (swfVersion > 5) {
      $.shiftJis = stream.readUb(1);
    } else {
      reserved = stream.readUb(1);
    }
    $.smallText = stream.readUb(1);
    $.ansi = stream.readUb(1);
    var wideOffset = $.wideOffset = stream.readUb(1);
    var wide = $.wide = stream.readUb(1);
    $.italic = stream.readUb(1);
    $.bold = stream.readUb(1);
    if (swfVersion > 5) {
      $.language = stream.readUi8();
    } else {
      reserved = stream.readUi8();
      $.language = 0;
    }
    var nameLength = stream.readUi8();
    $.name = readString($bytes, $stream, nameLength);
    if (tagCode === 75) {
      $.resolution = 20;
    }
    var glyphCount = $.glyphCount = stream.readUi16();
    var startpos = $stream.pos;
    if (wideOffset) {
      var $0 = $.offsets = [];
      var $1 = glyphCount;
      while ($1--) {
        $0.push(stream.readUi32());
      }
      $.mapOffset = stream.readUi32();
    } else {
      var $2 = $.offsets = [];
      var $3 = glyphCount;
      while ($3--) {
        $2.push(stream.readUi16());
      }
      $.mapOffset = stream.readUi16();
    }
    var $4 = $.glyphs = [];
    var $5 = glyphCount;
    while ($5--) {
      var $6 = {};
      var dist = $.offsets[glyphCount-$5]+startpos-$stream.pos;
      // when just one byte difference between two offsets, just read that and insert a eos record
      if( dist === 1 ) {
        readUi8($bytes,$stream);
        $4.push({"records":[{"type":0,"eos":true,"hasNewStyles":0,"hasLineStyle":0,"hasFillStyle1":0,"hasFillStyle0":0,"move":0}]});
        continue;
      }
      shape($bytes, $stream, $6, swfVersion, tagCode);
      $4.push($6);
    }
    if (wide) {
      var $47 = $.codes = [];
      var $48 = glyphCount;
      while ($48--) {
        $47.push(stream.readUi16());
      }
    } else {
      var $49 = $.codes = [];
      var $50 = glyphCount;
      while ($50--) {
        $49.push(stream.readUi8());
      }
    }
    if (hasLayout) {
      $.ascent = stream.readUi16();
      $.descent = stream.readUi16();
      $.leading = readSi16($bytes, $stream);
      var $51 = $.advance = [];
      var $52 = glyphCount;
      while ($52--) {
        $51.push(readSi16($bytes, $stream));
      }
      var $53 = $.bbox = [];
      var $54 = glyphCount;
      while ($54--) {
        var $55 = {};
        $55 = RECT.FromStream(stream);
        $53.push($55);
      }
      var kerningCount = stream.readUi16();
      var $56 = $.kerning = [];
      var $57 = kerningCount;
      while ($57--) {
        var $58 = {};
        kerning($bytes, $stream, $58, swfVersion, tagCode, wide);
        $56.push($58);
      }
    }
    return $;
  }

  function defineFont4($bytes, $stream, $, swfVersion, tagCode) {
    $ || ($ = {});
    $.id = stream.readUi16();
    var reserved = stream.readUb(5);
    var hasFontData = $.hasFontData = stream.readUb(1);
    $.italic = stream.readUb(1);
    $.bold = stream.readUb(1);
    $.name = stream.readString(0);
    if (hasFontData) {
      $.data = readBinary($bytes, $stream, 0, false);
    }
    return $;
  }

  function fileAttributes($bytes, $stream, $, swfVersion, tagCode) {
    $ || ($ = {});
    var reserved = stream.readUb(1);
    $.useDirectBlit = stream.readUb(1);
    $.useGpu = stream.readUb(1);
    $.hasMetadata = stream.readUb(1);
    $.doAbc = stream.readUb(1);
    $.noCrossDomainCaching = stream.readUb(1);
    $.relativeUrls = stream.readUb(1);
    $.network = stream.readUb(1);
    var pad = readUb($bytes, $stream, 24);
    return $;
  }

  function doABC($bytes, $stream, $, swfVersion, tagCode) {
    $ || ($ = {});
    if (tagCode === 82) {
      $.flags = stream.readUi32();
    }
    else {
      $.flags = 0;
    }
    if (tagCode === 82) {
      $.name = stream.readString(0);
    }
    else {
      $.name = "";
    }
    $.data = readBinary($bytes, $stream, 0, false);
    return $;
  }

  function exportAssets($bytes, $stream, $, swfVersion, tagCode) {
    $ || ($ = {});
    var exportsCount = stream.readUi16();
    var $0 = $.exports = [];
    var $1 = exportsCount;
    while ($1--) {
      var $2: any = {};
      $2.symbolId = stream.readUi16();
      $2.className = stream.readString(0);
      $0.push($2);
    }
    return $;
  }

  function symbolClass($bytes, $stream, $, swfVersion, tagCode) {
    $ || ($ = {});
    var symbolCount = stream.readUi16();
    var $0 = $.exports = [];
    var $1 = symbolCount;
    while ($1--) {
      var $2: any = {};
      $2.symbolId = stream.readUi16();
      $2.className = stream.readString(0);
      $0.push($2);
    }
    return $;
  }

  function defineScalingGrid($bytes, $stream, $, swfVersion, tagCode) {
    $ || ($ = {});
    $.symbolId = stream.readUi16();
    var $0 = $.splitter = {};
    $0 = RECT.FromStream(stream);
    return $;
  }

  function defineScene($bytes, $stream, $, swfVersion, tagCode) {
    $ || ($ = {});
    var sceneCount = readEncodedU32($bytes, $stream);
    var $0 = $.scenes = [];
    var $1 = sceneCount;
    while ($1--) {
      var $2: any = {};
      $2.offset = readEncodedU32($bytes, $stream);
      $2.name = stream.readString(0);
      $0.push($2);
    }
    var labelCount = readEncodedU32($bytes, $stream);
    var $3 = $.labels = [];
    var $4 = labelCount;
    while ($4--) {
      var $5: any = {};
      $5.frame = readEncodedU32($bytes, $stream);
      $5.name = stream.readString(0);
      $3.push($5);
    }
    return $;
  }

  function fillSolid($bytes, $stream, $, swfVersion, tagCode, isMorph) {
    if (tagCode > 22 || isMorph) {
      $.color = rgba(stream);
    }
    else {
      $.color = rgb($bytes, $stream);
    }
    if (isMorph) {
      $.colorMorph = rgba(stream);
    }
  }

  function fillGradient($bytes, $stream, $, swfVersion, tagCode, isMorph, type) {
    var $128 = $.matrix = {};
    matrix($bytes, $stream, $128, swfVersion, tagCode);
    if (isMorph) {
      var $129 = $.matrixMorph = {};
      matrix($bytes, $stream, $129, swfVersion, tagCode);
    }
    gradient($bytes, $stream, $, swfVersion, tagCode, isMorph, type);
  }

  function gradient($bytes, $stream, $, swfVersion, tagCode, isMorph, type) {
    if (tagCode === 83) {
      $.spreadMode = readUb($bytes, $stream, 2);
      $.interpolationMode = readUb($bytes, $stream, 2);
    }
    else {
      var pad = stream.readUb(4);
    }
    var count = $.count = stream.readUb(4);
    var $130 = $.records = [];
    var $131 = count;
    while ($131--) {
      var $132 = {};
      gradientRecord($bytes, $stream, $132, swfVersion, tagCode, isMorph);
      $130.push($132);
    }
    if (type === 19) {
      $.focalPoint = readSi16($bytes, $stream);
      if (isMorph) {
        $.focalPointMorph = readSi16($bytes, $stream);
      }
    }
  }

  function gradientRecord($bytes, $stream, $, swfVersion, tagCode, isMorph) {
    $.ratio = stream.readUi8();
    if (tagCode > 22) {
      $.color = rgba(stream);
    }
    else {
      $.color = rgb($bytes, $stream);
    }
    if (isMorph) {
      $.ratioMorph = stream.readUi8();
      $.colorMorph = rgba(stream);
    }
  }

  function morphShapeWithStyle($bytes, $stream, $, swfVersion, tagCode, isMorph, hasStrokes) {
    var eos: boolean, bits: number, temp: any;
    temp = styles($bytes, $stream, $, swfVersion, tagCode, isMorph, hasStrokes);
    var lineBits = temp.lineBits;
    var fillBits = temp.fillBits;
    var $160 = $.records = [];
    do {
      var $161 = {};
      temp = shapeRecord($bytes, $stream, $161, swfVersion, tagCode, isMorph,
        fillBits, lineBits, hasStrokes, bits);
      eos = temp.eos;
      var flags = temp.flags;
      var type = temp.type;
      var fillBits = temp.fillBits;
      var lineBits = temp.lineBits;
      bits = temp.bits;
      $160.push($161);
    } while (!eos);
    temp = styleBits($bytes, $stream, $, swfVersion, tagCode);
    var fillBits = temp.fillBits;
    var lineBits = temp.lineBits;
    var $162 = $.recordsMorph = [];
    do {
      var $163 = {};
      temp = shapeRecord($bytes, $stream, $163, swfVersion, tagCode, isMorph,
        fillBits, lineBits, hasStrokes, bits);
      eos = temp.eos;
      var flags = temp.flags;
      var type = temp.type;
      var fillBits = temp.fillBits;
      var lineBits = temp.lineBits;
      bits = temp.bits;
      $162.push($163);
    } while (!eos);
  }

  function shapeWithStyle($bytes, $stream, $, swfVersion, tagCode, isMorph, hasStrokes) {
    var eos: boolean, bits: number, temp: any;
    temp = styles($bytes, $stream, $, swfVersion, tagCode, isMorph, hasStrokes);
    var fillBits = temp.fillBits;
    var lineBits = temp.lineBits;
    var $160 = $.records = [];
    do {
      var $161 = {};
      temp = shapeRecord($bytes, $stream, $161, swfVersion, tagCode, isMorph,
        fillBits, lineBits, hasStrokes, bits);
      eos = temp.eos;
      var flags = temp.flags;
      var type = temp.type;
      var fillBits = temp.fillBits;
      var lineBits = temp.lineBits;
      bits = temp.bits;
      $160.push($161);
    } while (!eos);
  }

  function shapeRecord($bytes, $stream, $, swfVersion, tagCode, isMorph, fillBits, lineBits, hasStrokes, bits: number) {
    var eos: boolean, temp: any;
    var type = $.type = stream.readUb(1);
    var flags = stream.readUb(5);
    eos = $.eos = !(type || flags);
    if (type) {
      temp = shapeRecordEdge($bytes, $stream, $, swfVersion, tagCode, flags, bits);
      bits = temp.bits;
    } else {
      temp = shapeRecordSetup($bytes, $stream, $, swfVersion, tagCode, flags, isMorph,
        fillBits, lineBits, hasStrokes, bits);
      var fillBits = temp.fillBits;
      var lineBits = temp.lineBits;
      bits = temp.bits;
    }
    return {
      type: type,
      flags: flags,
      eos: eos,
      fillBits: fillBits,
      lineBits: lineBits,
      bits: bits
    };
  }

  function shapeRecordEdge($bytes, $stream, $, swfVersion, tagCode, flags, bits: number) {
    var isStraight = 0, tmp = 0, bits = 0, isGeneral = 0, isVertical = 0;
    isStraight = $.isStraight = flags >> 4;
    tmp = flags & 0x0f;
    bits = tmp + 2;
    if (isStraight) {
      isGeneral = $.isGeneral = stream.readUb(1);
      if (isGeneral) {
        $.deltaX = stream.readSb(bits);
        $.deltaY = stream.readSb(bits);
      } else {
        isVertical = $.isVertical = stream.readUb(1);
        if (isVertical) {
          $.deltaY = stream.readSb(bits);
        } else {
          $.deltaX = stream.readSb(bits);
        }
      }
    } else {
      $.controlDeltaX = stream.readSb(bits);
      $.controlDeltaY = stream.readSb(bits);
      $.anchorDeltaX = stream.readSb(bits);
      $.anchorDeltaY = stream.readSb(bits);
    }
    return {bits: bits};
  }

  function shapeRecordSetup($bytes, $stream, $, swfVersion, tagCode, flags, isMorph, fillBits: number, lineBits: number, hasStrokes, bits: number) {
    var hasNewStyles = 0, hasLineStyle = 0, hasFillStyle1 = 0;
    var hasFillStyle0 = 0, move = 0;
    if (tagCode > 2) {
      hasNewStyles = $.hasNewStyles = flags >> 4;
    } else {
      hasNewStyles = $.hasNewStyles = 0;
    }
    hasLineStyle = $.hasLineStyle = flags >> 3 & 1;
    hasFillStyle1 = $.hasFillStyle1 = flags >> 2 & 1;
    hasFillStyle0 = $.hasFillStyle0 = flags >> 1 & 1;
    move = $.move = flags & 1;
    if (move) {
      bits = stream.readUb(5);
      $.moveX = stream.readSb(bits);
      $.moveY = stream.readSb(bits);
    }
    if (hasFillStyle0) {
      $.fillStyle0 = readUb($bytes, $stream, fillBits);
    }
    if (hasFillStyle1) {
      $.fillStyle1 = readUb($bytes, $stream, fillBits);
    }
    if (hasLineStyle) {
      $.lineStyle = readUb($bytes, $stream, lineBits);
    }
    if (hasNewStyles) {
      var temp = styles($bytes, $stream, $, swfVersion, tagCode, isMorph, hasStrokes);
      lineBits = temp.lineBits;
      fillBits = temp.fillBits;
    }
    return {
      lineBits: lineBits,
      fillBits: fillBits,
      bits: bits
    };
  }

  function styles($bytes, $stream, $, swfVersion, tagCode, isMorph, hasStrokes) {
    fillStyleArray($bytes, $stream, $, swfVersion, tagCode, isMorph);
    lineStyleArray($bytes, $stream, $, swfVersion, tagCode, isMorph, hasStrokes);
    var temp = styleBits($bytes, $stream, $, swfVersion, tagCode);
    var fillBits = temp.fillBits;
    var lineBits = temp.lineBits;
    return {fillBits: fillBits, lineBits: lineBits};
  }

  function fillStyleArray($bytes, $stream, $, swfVersion, tagCode, isMorph) {
    var count;
    var tmp = stream.readUi8();
    if (tagCode > 2 && tmp === 255) {
      count = stream.readUi16();
    }
    else {
      count = tmp;
    }
    var $4 = $.fillStyles = [];
    var $5 = count;
    while ($5--) {
      var $6 = {};
      fillStyle($bytes, $stream, $6, swfVersion, tagCode, isMorph);
      $4.push($6);
    }
  }

  function lineStyleArray($bytes, $stream, $, swfVersion, tagCode, isMorph, hasStrokes) {
    var count;
    var tmp = stream.readUi8();
    if (tagCode > 2 && tmp === 255) {
      count = stream.readUi16();
    } else {
      count = tmp;
    }
    var $138 = $.lineStyles = [];
    var $139 = count;
    while ($139--) {
      var $140 = {};
      lineStyle($bytes, $stream, $140, swfVersion, tagCode, isMorph, hasStrokes);
      $138.push($140);
    }
  }

  function styleBits($bytes, $stream, $, swfVersion, tagCode) {
    align($bytes, $stream);
    var fillBits = stream.readUb(4);
    var lineBits = stream.readUb(4);
    return {
      fillBits: fillBits,
      lineBits: lineBits
    };
  }

  function fillStyle($bytes, $stream, $, swfVersion, tagCode, isMorph) {
    var type = $.type = stream.readUi8();
    switch (type) {
      case 0:
        fillSolid($bytes, $stream, $, swfVersion, tagCode, isMorph);
        break;
      case 16:
      case 18:
      case 19:
        fillGradient($bytes, $stream, $, swfVersion, tagCode, isMorph, type);
        break;
      case 64:
      case 65:
      case 66:
      case 67:
        fillBitmap($bytes, $stream, $, swfVersion, tagCode, isMorph, type);
        break;
      default:
    }
  }

  function lineStyle($bytes, $stream, $, swfVersion, tagCode, isMorph, hasStrokes) {
    $.width = stream.readUi16();
    if (isMorph) {
      $.widthMorph = stream.readUi16();
    }
    if (hasStrokes) {
      align($bytes, $stream);
      $.startCapsStyle = readUb($bytes, $stream, 2);
      var jointStyle = $.jointStyle = readUb($bytes, $stream, 2);
      var hasFill = $.hasFill = stream.readUb(1);
      $.noHscale = stream.readUb(1);
      $.noVscale = stream.readUb(1);
      $.pixelHinting = stream.readUb(1);
      var reserved = stream.readUb(5);
      $.noClose = stream.readUb(1);
      $.endCapsStyle = readUb($bytes, $stream, 2);
      if (jointStyle === 2) {
        $.miterLimitFactor = stream.readFixed8();
      }
      if (hasFill) {
        var $141 = $.fillStyle = {};
        fillStyle($bytes, $stream, $141, swfVersion, tagCode, isMorph);
      } else {
        $.color = rgba(stream);
        if (isMorph) {
          $.colorMorph = rgba(stream);
        }
      }
    }
    else {
      if (tagCode > 22) {
        $.color = rgba(stream);
      } else {
        $.color = rgb($bytes, $stream);
      }
      if (isMorph) {
        $.colorMorph = rgba(stream);
      }
    }
  }

  function fillBitmap($bytes, $stream, $, swfVersion, tagCode, isMorph, type) {
    $.bitmapId = stream.readUi16();
    var $18 = $.matrix = {};
    matrix($bytes, $stream, $18, swfVersion, tagCode);
    if (isMorph) {
      var $19 = $.matrixMorph = {};
      matrix($bytes, $stream, $19, swfVersion, tagCode);
    }
    $.condition = type === 64 || type === 67;
  }


  function anyFilter($bytes, $stream, $, swfVersion, tagCode) {
    var type = $.type = stream.readUi8();
    switch (type) {
      case 0:
      case 2:
      case 3:
      case 4:
      case 7:
        filterGlow($bytes, $stream, $, swfVersion, tagCode, type);
        break;
      case 1:
        filterBlur($bytes, $stream, $, swfVersion, tagCode);
        break;
      case 5:
        filterConvolution($bytes, $stream, $, swfVersion, tagCode);
        break;
      case 6:
        filterColorMatrix($bytes, $stream, $, swfVersion, tagCode);
        break;
      default:
    }
  }

  function events($bytes, $stream, $, swfVersion, tagCode) {
    var flags = swfVersion >= 6 ? stream.readUi32() : stream.readUi16();
    var eoe = $.eoe = !flags;
    var keyPress = 0;
    $.onKeyUp = flags >> 7 & 1;
    $.onKeyDown = flags >> 6 & 1;
    $.onMouseUp = flags >> 5 & 1;
    $.onMouseDown = flags >> 4 & 1;
    $.onMouseMove = flags >> 3 & 1;
    $.onUnload = flags >> 2 & 1;
    $.onEnterFrame = flags >> 1 & 1;
    $.onLoad = flags & 1;
    if (swfVersion >= 6) {
      $.onDragOver = flags >> 15 & 1;
      $.onRollOut = flags >> 14 & 1;
      $.onRollOver = flags >> 13 & 1;
      $.onReleaseOutside = flags >> 12 & 1;
      $.onRelease = flags >> 11 & 1;
      $.onPress = flags >> 10 & 1;
      $.onInitialize = flags >> 9 & 1;
      $.onData = flags >> 8 & 1;
      if (swfVersion >= 7) {
        $.onConstruct = flags >> 18 & 1;
      } else {
        $.onConstruct = 0;
      }
      keyPress = $.keyPress = flags >> 17 & 1;
      $.onDragOut = flags >> 16 & 1;
    }
    if (!eoe) {
      var length = $.length = stream.readUi32();
      if (keyPress) {
        $.keyCode = stream.readUi8();
      }
      $.actionsData = readBinary($bytes, $stream, length - +keyPress, false);
    }
    return eoe;
  }

  function kerning($bytes, $stream, $, swfVersion, tagCode, wide) {
    if (wide) {
      $.code1 = stream.readUi16();
      $.code2 = stream.readUi16();
    }
    else {
      $.code1 = stream.readUi8();
      $.code2 = stream.readUi8();
    }
    $.adjustment = stream.readUi16();
  }

  function textEntry($bytes, $stream, $, swfVersion, tagCode, glyphBits, advanceBits) {
    $.glyphIndex = readUb($bytes, $stream, glyphBits);
    $.advance = stream.readSb(advanceBits);
  }

  function textRecordSetup($bytes, $stream, $, swfVersion, tagCode, flags) {
    var hasFont = $.hasFont = flags >> 3 & 1;
    var hasColor = $.hasColor = flags >> 2 & 1;
    var hasMoveY = $.hasMoveY = flags >> 1 & 1;
    var hasMoveX = $.hasMoveX = flags & 1;
    if (hasFont) {
      $.fontId = stream.readUi16();
    }
    if (hasColor) {
      if (tagCode === 33) {
        $.color = rgba(stream);
      } else {
        $.color = rgb($bytes, $stream);
      }
    }
    if (hasMoveX) {
      $.moveX = readSi16($bytes, $stream);
    }
    if (hasMoveY) {
      $.moveY = readSi16($bytes, $stream);
    }
    if (hasFont) {
      $.fontHeight = stream.readUi16();
    }
  }

  function textRecord($bytes, $stream, $, swfVersion, tagCode, glyphBits, advanceBits) {
    var glyphCount;
    align($bytes, $stream);
    var flags = readUb($bytes, $stream, 8);
    var eot = $.eot = !flags;
    textRecordSetup($bytes, $stream, $, swfVersion, tagCode, flags);
    if (!eot) {
      var tmp = stream.readUi8();
      if (swfVersion > 6) {
        glyphCount = $.glyphCount = tmp;
      } else {
        glyphCount = $.glyphCount = tmp; // & 0x7f;
      }
      var $6 = $.entries = [];
      var $7 = glyphCount;
      while ($7--) {
        var $8 = {};
        textEntry($bytes, $stream, $8, swfVersion, tagCode, glyphBits, advanceBits);
        $6.push($8);
      }
    }
    return {eot: eot};
  }

  function soundEnvelope($bytes, $stream, $, swfVersion, tagCode) {
    $.pos44 = stream.readUi32();
    $.volumeLeft = stream.readUi16();
    $.volumeRight = stream.readUi16();
  }

  function soundInfo($bytes, $stream, $, swfVersion, tagCode) {
    var reserved = readUb($bytes, $stream, 2);
    $.stop = stream.readUb(1);
    $.noMultiple = stream.readUb(1);
    var hasEnvelope = $.hasEnvelope = stream.readUb(1);
    var hasLoops = $.hasLoops = stream.readUb(1);
    var hasOutPoint = $.hasOutPoint = stream.readUb(1);
    var hasInPoint = $.hasInPoint = stream.readUb(1);
    if (hasInPoint) {
      $.inPoint = stream.readUi32();
    }
    if (hasOutPoint) {
      $.outPoint = stream.readUi32();
    }
    if (hasLoops) {
      $.loopCount = stream.readUi16();
    }
    if (hasEnvelope) {
      var envelopeCount = $.envelopeCount = stream.readUi8();
      var $1 = $.envelopes = [];
      var $2 = envelopeCount;
      while ($2--) {
        var $3 = {};
        soundEnvelope($bytes, $stream, $3, swfVersion, tagCode);
        $1.push($3);
      }
    }
  }

  function button($bytes, $stream, $, swfVersion, tagCode) {
    var flags = stream.readUi8();
    var eob = $.eob = !flags;
    if (swfVersion >= 8) {
      $.flags = (flags >> 5 & 1 ? PlaceFlags.HasBlendMode : 0) |
                (flags >> 4 & 1 ? PlaceFlags.HasFilterList : 0);
    }
    else {
      $.flags = 0;
    }
    $.stateHitTest = flags >> 3 & 1;
    $.stateDown = flags >> 2 & 1;
    $.stateOver = flags >> 1 & 1;
    $.stateUp = flags & 1;
    if (!eob) {
      $.symbolId = stream.readUi16();
      $.depth = stream.readUi16();
      var $2 = $.matrix = {};
      matrix($bytes, $stream, $2, swfVersion, tagCode);
      if (tagCode === SWFTag.DEFINE_BUTTON2) {
        var $3 = $.cxform = {};
        cxform($bytes, $stream, $3, swfVersion, tagCode);
      }
      if ($.flags & PlaceFlags.HasFilterList) {
        $.filterCount = stream.readUi8();
        var $4 = $.filters = {};
        anyFilter($bytes, $stream, $4, swfVersion, tagCode);
      }
      if ($.flags & PlaceFlags.HasBlendMode) {
        $.blendMode = stream.readUi8();
      }
    }
    return {eob: eob};
  }

  function buttonCondAction($bytes, $stream, $, swfVersion, tagCode) {
    var tagSize = stream.readUi16();
    var conditions = stream.readUi16();
    // The 7 upper bits hold a key code the button should respond to.
    $.keyCode = (conditions & 0xfe00) >> 9;
    // The lower 9 bits hold state transition flags. See the enum in AS2Button for details.
    $.stateTransitionFlags = conditions & 0x1ff;
    // If no tagSize is given, pass `0` to readBinary.
    $.actionsData = readBinary($bytes, $stream, (tagSize || 4) - 4, false);
  }

  function shape($bytes, $stream, $, swfVersion, tagCode) {
    var eos: boolean, bits: number, temp: any;
    temp = styleBits($bytes, $stream, $, swfVersion, tagCode);
    var fillBits = temp.fillBits;
    var lineBits = temp.lineBits;
    var $4 = $.records = [];
    do {
      var $5 = {};
      var isMorph = false; // FIXME Is this right?
      var hasStrokes = false;  // FIXME Is this right?
      temp = shapeRecord($bytes, $stream, $5, swfVersion, tagCode, isMorph,
        fillBits, lineBits, hasStrokes, bits);
      eos = temp.eos;
      var fillBits = temp.fillBits;
      var lineBits = temp.lineBits;
      bits = bits;
      $4.push($5);
    } while (!eos);
  }

  */

  export var tagHandler: any = {
    /* End */                            0: undefined,
//    /* ShowFrame */                      1: undefined,
//    /* DefineShape */                    2: defineShape,
    /* PlaceObject */                    4: PlaceObject.FromStream,
//    /* RemoveObject */                   5: removeObject,
//    /* DefineBits */                     6: defineImage,
//    /* DefineButton */                   7: defineButton,
//    /* JPEGTables */                     8: defineJPEGTables,
//    /* SetBackgroundColor */             9: setBackgroundColor,
//    /* DefineFont */                    10: defineFont,
//    /* DefineText */                    11: defineLabel,
//    /* DoAction */                      12: doAction,
//    /* DefineFontInfo */                13: undefined,
//    /* DefineSound */                   14: defineSound,
//    /* StartSound */                    15: startSound,
//    /* DefineButtonSound */             17: undefined,
//    /* SoundStreamHead */               18: soundStreamHead,
//    /* SoundStreamBlock */              19: soundStreamBlock,
//    /* DefineBitsLossless */            20: defineBitmap,
//    /* DefineBitsJPEG2 */               21: defineImage,
//    /* DefineShape2 */                  22: defineShape,
//    /* DefineButtonCxform */            23: undefined,
//    /* Protect */                       24: undefined,
//    /* PlaceObject2 */                  26: placeObject,
//    /* RemoveObject2 */                 28: removeObject,
//    /* DefineShape3 */                  32: defineShape,
//    /* DefineText2 */                   33: defineLabel,
//    /* DefineButton2 */                 34: defineButton,
//    /* DefineBitsJPEG3 */               35: defineImage,
//    /* DefineBitsLossless2 */           36: defineBitmap,
//    /* DefineEditText */                37: defineText,
//    /* DefineSprite */                  39: undefined,
//    /* FrameLabel */                    43: frameLabel,
//    /* SoundStreamHead2 */              45: soundStreamHead,
//    /* DefineMorphShape */              46: defineShape,
//    /* DefineFont2 */                   48: defineFont2,
//    /* ExportAssets */                  56: exportAssets,
//    /* ImportAssets */                  57: undefined,
//    /* EnableDebugger */                58: undefined,
//    /* DoInitAction */                  59: doAction,
//    /* DefineVideoStream */             60: undefined,
//    /* VideoFrame */                    61: undefined,
//    /* DefineFontInfo2 */               62: undefined,
//    /* EnableDebugger2 */               64: undefined,
//    /* ScriptLimits */                  65: undefined,
//    /* SetTabIndex */                   66: undefined,
//    /* FileAttributes */                69: fileAttributes,
//    /* PlaceObject3 */                  70: placeObject,
//    /* ImportAssets2 */                 71: undefined,
//    /* DoABC (undoc) */                 72: doABC,
//    /* DefineFontAlignZones */          73: undefined,
//    /* CSMTextSettings */               74: undefined,
//    /* DefineFont3 */                   75: defineFont2,
//    /* SymbolClass */                   76: symbolClass,
//    /* Metadata */                      77: undefined,
//    /* DefineScalingGrid */             78: defineScalingGrid,
//    /* DoABC */                         82: doABC,
//    /* DefineShape4 */                  83: defineShape,
//    /* DefineMorphShape2 */             84: defineShape,
//    /* DefineSceneAndFrameLabelData */  86: defineScene,
//    /* DefineBinaryData */              87: defineBinaryData,
//    /* DefineFontName */                88: undefined,
//    /* StartSound2 */                   89: startSound,
//    /* DefineBitsJPEG4 */               90: defineImage,
//    /* DefineFont4 */                   91: defineFont4
  };

  function rgb(stream: DataBuffer): number {
    return ((stream.readUi8() << 24) | (stream.readUi8() << 16) | (stream.readUi8() << 8) | 0xff) >>> 0;
  }

  function rgba(stream: DataBuffer): number {
    return (stream.readUi8() << 24) | (stream.readUi8() << 16) | (stream.readUi8() << 8) | stream.readUi8();
  }

  function argb(stream: DataBuffer) {
    return stream.readUi8() | (stream.readUi8() << 24) | (stream.readUi8() << 16) | (stream.readUi8() << 8);
  }

  export class BLURFILTER {
    blurX: number;
    blurY: number;
    passes: number;
    static FromStream(stream: DataBuffer, filter?: BLURFILTER): BLURFILTER {
      filter || (filter = new BLURFILTER());
      filter.blurX = stream.readFixed();
      filter.blurY = stream.readFixed();
      filter.passes = stream.readUb(5);
      stream.readUb(3);
      return filter;
    }
  }

  export class CONVOLUTIONFILTER {
    matrixX: number;
    matrixY: number;
    divisor: number;
    bias: number;
    matrix: number [];
    defaultColor: number;
    clamp: boolean;
    preserveAlpha: boolean;
    static FromStream(stream: DataBuffer, filter?: CONVOLUTIONFILTER): CONVOLUTIONFILTER {
      filter || (filter = new CONVOLUTIONFILTER());
      filter.matrixX = stream.readUi8();
      filter.matrixY = stream.readUi8();
      filter.divisor = stream.readFloat();
      filter.bias = stream.readFloat();
      filter.matrix = [];
      var count = filter.matrixX * filter.matrixY;
      while (count--) {
        filter.matrix.push(stream.readFloat());
      }
      filter.defaultColor = rgba(stream);
      var reserved = stream.readUb(6);
      filter.clamp = !!stream.readUb(1);
      filter.preserveAlpha = !!stream.readUb(1);
      return filter;
    }
  }

  export class COLORMATRIXFILTER {
    matrix: number [];
    static FromStream(stream: DataBuffer, filter?: COLORMATRIXFILTER): COLORMATRIXFILTER {
      filter || (filter = new COLORMATRIXFILTER());
      filter.matrix = [];
      var count = 20;
      while (count--) {
        filter.matrix.push(stream.readFloat());
      }
      return filter;
    }
  }

  export class DROPSHADOWFILTER {
    dropShadowColor: number;
    blurX: number;
    blurY: number;
    angle: number;
    distance: number;
    strength: number;
    innerShadow: boolean;
    knockout: boolean;
    compositeSource: boolean;
    passes: number;
    static FromStream(stream: DataBuffer, filter?: DROPSHADOWFILTER): DROPSHADOWFILTER {
      filter || (filter = new DROPSHADOWFILTER());
      filter.dropShadowColor = rgba(stream);
      filter.blurX = stream.readFixed();
      filter.blurY = stream.readFixed();
      filter.angle = stream.readFixed();
      filter.distance = stream.readFixed();
      filter.strength = stream.readFixed8();
      filter.innerShadow = !!stream.readUb(1);
      filter.knockout = !!stream.readUb(1);
      filter.compositeSource = !!stream.readUb(1);
      filter.passes = stream.readUb(5);
      return filter;
    }
  }

  export class GLOWFILTER {
    glowColor: number;
    blurX: number;
    blurY: number;
    strength: number;
    innerGlow: boolean;
    knockout: boolean;
    compositeSource: boolean;
    passes: number;
    static FromStream(stream: DataBuffer, gradient: boolean): any {
      var filter: any = gradient ? new GRADIENTGLOWFILTER() : new GLOWFILTER();
      if (gradient) {
        var numColors = stream.readUi8();
        filter.gradientColors = [];
        for (var i = 0; i < numColors; i++) {
          filter.gradientColors.push(rgba(stream));
        }
        filter.gradientRatio = [];
        for (var i = 0; i < numColors; i++) {
          filter.gradientRatio.push(stream.readUi8());
        }
      } else {
        filter.glowColor = rgba(stream);
      }
      filter.glowColor = rgba(stream);
      filter.blurX = stream.readFixed();
      filter.blurY = stream.readFixed();
      filter.strength = stream.readFixed8();
      filter.innerGlow = stream.readUb(1);
      filter.knockout = stream.readUb(1);
      filter.compositeSource = stream.readUb(1);
      filter.passes = stream.readUb(5);
      return filter;
    }
  }

  export class BEVELFILTER {
    shadowColor: number;
    highlightColor: number;
    blurX: number;
    blurY: number;
    angle: number;
    distance: number;
    strength: number;
    innerShadow: boolean;
    knockout: boolean;
    compositeSource: boolean;
    onTop: boolean;
    passes: number;

    static FromStream(stream: DataBuffer, gradient: boolean): any {
      var filter: any = gradient ? new BEVELFILTER() : new GRADIENTBEVELFILTER();
      if (gradient) {
        var numColors = stream.readUi8();
        filter.gradientColors = [];
        for (var i = 0; i < numColors; i++) {
          filter.gradientColors.push(rgba(stream));
        }
        filter.gradientRatio = [];
        for (var i = 0; i < numColors; i++) {
          filter.gradientRatio.push(stream.readUi8());
        }
      } else {
        filter.shadowColor = rgba(stream);
        filter.highlightColor = rgba(stream);
      }
      filter.blurX = stream.readFixed();
      filter.blurY = stream.readFixed();
      filter.angle = stream.readFixed();
      filter.distance = stream.readFixed();
      filter.strength = stream.readFixed8();
      filter.innerShadow = stream.readUb(1);
      filter.knockout = stream.readUb(1);
      filter.compositeSource = stream.readUb(1);
      filter.onTop = stream.readUb(1);
      filter.passes = stream.readUb(5);
      return filter;
    }
  }

  export class GRADIENTGLOWFILTER {
    gradientColors: number [];
    gradientRatio: number [];
    blurX: number;
    blurY: number;
    strength: number;
    innerGlow: boolean;
    knockout: boolean;
    compositeSource: boolean;
    passes: number;
  }

  export class GRADIENTBEVELFILTER  {
    gradientColors: number [];
    gradientRatio: number [];
    blurX: number;
    blurY: number;
    angle: number;
    distance: number;
    strength: number;
    innerShadow: boolean;
    knockout: boolean;
    compositeSource: boolean;
    onTop: boolean;
    passes: number;
  }

  export class FILTER {
    static FromStream(stream: DataBuffer): any {
      var filterId = stream.readUi8();
      switch (filterId) {
        case 0: /* Has DropShadowFilter */
          return DROPSHADOWFILTER.FromStream(stream);
        case 1: /* Has BlurFilter */
          return BLURFILTER.FromStream(stream);
        case 2: /* Has GlowFilter */
          return GLOWFILTER.FromStream(stream, false);
        case 3: /* Has BevelFilter */
          return BEVELFILTER.FromStream(stream, false);
        case 4: /* Has GradientGlowFilter */
          return GLOWFILTER.FromStream(stream, true);
        case 5: /* Has ConvolutionFilter */
          return CONVOLUTIONFILTER.FromStream(stream);
        case 6: /* Has ColorMatrixFilter */
          return COLORMATRIXFILTER.FromStream(stream);
        case 7: /* Has GradientBevelFilter */
          return BEVELFILTER.FromStream(stream, true);
      }
    }
  }

  export class CLIPACTIONS {
    allEventFlags: ClipEventFlags;
    clipActionRecords: CLIPACTIONRECORD [];

    static FromStream(stream: DataBuffer, clipActions: CLIPACTIONS, context: SWFParserContext): CLIPACTIONS {
      clipActions || (clipActions = new CLIPACTIONS());
      var reserved = stream.readUi16();
      if (context.swfVersion >= 6) {
        clipActions.allEventFlags = stream.readUi32();
      } else {
        clipActions.allEventFlags = stream.readUi16();
      }
      clipActions.clipActionRecords = [];
      do {
        var clipActionRecord = CLIPACTIONRECORD.FromStream(stream, null, context);
        clipActions.clipActionRecords.push(clipActionRecord);
      } while (!clipActionRecord.eventFlags);
      return clipActions;
    }
  }

  export class CLIPACTIONRECORD {
    eventFlags: ClipEventFlags;
    keyCode: number;
    actions: Uint8Array;
    static FromStream(stream: DataBuffer, clipActionRecord: CLIPACTIONRECORD, context: SWFParserContext): CLIPACTIONRECORD {
      clipActionRecord || (clipActionRecord = new CLIPACTIONRECORD());
      clipActionRecord.eventFlags = context.swfVersion >= 6 ? stream.readUi32() : stream.readUi16();
      if (clipActionRecord.eventFlags) {
        var actionRecordSize = stream.readUi32();
        if (clipActionRecord.eventFlags & ClipEventFlags.ClipEventPress) {
          clipActionRecord.keyCode = stream.readUi8();
        }
        clipActionRecord.actions = stream.readBinary(actionRecordSize - (keyPress ? 1 : 0), false);
      }
      return clipActionRecord;
    }
  }

  export class RECT {
    xMin: number;
    xMax: number;
    yMin: number;
    yMax: number;
    static FromStream(stream: DataBuffer, rect?: RECT): RECT {
      rect || (rect = new RECT());
      stream.align();
      var nbits = stream.readUnsignedBits(5);
      rect.xMin = stream.readBits(nbits);
      rect.xMax = stream.readBits(nbits);
      rect.yMin = stream.readBits(nbits);
      rect.yMax = stream.readBits(nbits);
      stream.align();
      return rect;
    }
  }

  export class MATRIX {
    scaleX: number;
    scaleY: number;
    rotateSkew0: number;
    rotateSkew1: number;
    translateX: number;
    translateY: number;
    static FromStream(stream: DataBuffer, matrix?: MATRIX): MATRIX {
      stream.align();
      matrix || (matrix = new MATRIX());
      var hasScale = stream.readBits(1);
      var scaleX = 0, scaleY = 0;
      if (hasScale) {
        var nScaleBits = stream.readBits(5);
        matrix.scaleX = stream.readFb(nScaleBits);
        matrix.scaleY = stream.readFb(nScaleBits);
      }
      var hasRotate = stream.readBits(1);
      var rotateSkew0, rotateSkew1;
      if (hasRotate) {
        var nRotateBits = stream.readBits(5);
        matrix.rotateSkew0 = stream.readFb(nRotateBits);
        matrix.rotateSkew1 = stream.readFb(nRotateBits);
      }
      var nTranslateBits = stream.readBits(5);
      matrix.translateX = stream.readSb(nTranslateBits);
      matrix.translateY = stream.readSb(nTranslateBits);
      stream.align();
      return matrix;
    }
  }

  export class CXFORM {
    redMultTerm: number;
    greenMultTerm: number;
    blueMultTerm: number;
    alphaMultTerm: number;
    redAddTerm: number;
    greenAddTerm: number;
    blueAddTerm: number;
    alphaAddTerm: number;

    static FromStream(stream: DataBuffer, cxform: CXFORM, withAlpha: boolean): CXFORM {
      stream.align();
      cxform || (cxform = new CXFORM());
      var hasAddTerm = stream.readUb(1);
      var hasMultTerm = stream.readUb(1);
      var nBits = stream.readUb(4);
      if (hasMultTerm) {
        cxform.redMultTerm = stream.readSb(nBits);
        cxform.greenMultTerm = stream.readSb(nBits);
        cxform.blueMultTerm = stream.readSb(nBits);
        if (withAlpha) {
          cxform.alphaMultTerm = stream.readSb(nBits);
        } else {
          cxform.alphaMultTerm = 256;
        }
      } else {
        cxform.redMultTerm = 256;
        cxform.greenMultTerm = 256;
        cxform.blueMultTerm = 256;
        cxform.alphaMultTerm = 256;
      }
      if (hasAddTerm) {
        cxform.redAddTerm = stream.readSb(nBits);
        cxform.greenAddTerm = stream.readSb(nBits);
        cxform.blueAddTerm = stream.readSb(nBits);
        if (withAlpha) {
          cxform.alphaAddTerm = stream.readSb(nBits);
        } else {
          cxform.alphaAddTerm = 0;
        }
      } else {
        cxform.redAddTerm = 0;
        cxform.greenAddTerm = 0;
        cxform.blueAddTerm = 0;
        cxform.alphaAddTerm = 0;
      }
      stream.align();
      return cxform;
    }
  }
  
  export class SWFHeader {
    frameSize: RECT;
    frameRate: number;
    frameCount: number;
    static FromStream(stream: DataBuffer, output: SWFHeader, context: SWFParserContext) {
      output || (output = new SWFHeader());
      output.frameSize = RECT.FromStream(stream);
      var frameRateFraction = stream.readUnsignedByte();
      output.frameRate = stream.readUnsignedByte() + frameRateFraction / 256;
      output.frameCount = stream.readUnsignedShort();
      return output;
    }
  }

  export class SWFParserContext {
    swfVersion: number;
    tagCode: number;
  }
}
