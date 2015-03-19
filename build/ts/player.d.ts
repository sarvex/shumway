/// <reference path="base.d.ts" />
/// <reference path="tools.d.ts" />
/// <reference path="swf.d.ts" />
/// <reference path="flash.d.ts" />
/// <reference path="../../src/flash/avm1.d.ts" />
declare module Shumway.Player {
    var timelineBuffer: Tools.Profiler.TimelineBuffer;
    var counter: Metrics.Counter;
    var writer: any;
    function enterTimeline(name: string, data?: any): void;
    function leaveTimeline(name: string, data?: any): void;
}
declare module Shumway {
    var playerOptions: any;
    var frameEnabledOption: any;
    var timerEnabledOption: any;
    var pumpEnabledOption: any;
    var pumpRateOption: any;
    var frameRateOption: any;
    var tracePlayerOption: any;
    var traceMouseEventOption: any;
    var frameRateMultiplierOption: any;
    var dontSkipFramesOption: any;
    var playAllSymbolsOption: any;
    var playSymbolOption: any;
    var playSymbolFrameDurationOption: any;
    var playSymbolCountOption: any;
}
declare module Shumway {
    class FrameScheduler {
        private static STATS_TO_REMEMBER;
        private static MAX_DRAWS_TO_SKIP;
        private static INTERVAL_PADDING_MS;
        private static SPEED_ADJUST_RATE;
        private _drawStats;
        private _drawStatsSum;
        private _drawStarted;
        private _drawsSkipped;
        private _expectedNextFrameAt;
        private _onTime;
        private _trackDelta;
        private _delta;
        private _onTimeDelta;
        constructor();
        shallSkipDraw: boolean;
        nextFrameIn: number;
        isOnTime: boolean;
        startFrame(frameRate: any): void;
        endFrame(): void;
        startDraw(): void;
        endDraw(): void;
        skipDraw(): void;
        setDelta(value: any): void;
        startTrackDelta(): void;
        endTrackDelta(): void;
    }
}
declare module Shumway.Remoting.Player {
    import flash = Shumway.AVM2.AS.flash;
    import Stage = flash.display.Stage;
    import Graphics = flash.display.Graphics;
    import NetStream = flash.net.NetStream;
    import BitmapData = flash.display.BitmapData;
    import DisplayObject = flash.display.DisplayObject;
    import Bounds = Shumway.Bounds;
    import IDataInput = Shumway.ArrayUtilities.IDataInput;
    import DataBuffer = Shumway.ArrayUtilities.DataBuffer;
    class PlayerChannelSerializer {
        output: DataBuffer;
        outputAssets: any[];
        phase: RemotingPhase;
        roots: DisplayObject[];
        begin(displayObject: DisplayObject): void;
        remoteObjects(): void;
        remoteReferences(): void;
        writeDirtyDisplayObjects(displayObject: DisplayObject, clearDirtyDescendentsFlag?: boolean): void;
        writeStage(stage: Stage, currentMouseTarget: flash.display.InteractiveObject): void;
        writeGraphics(graphics: Graphics): void;
        writeNetStream(netStream: NetStream, bounds: Bounds): void;
        writeBitmapData(bitmapData: BitmapData): void;
        writeTextContent(textContent: Shumway.TextContent): void;
        writeClippedObjectsCount(displayObject: DisplayObject): void;
        writeUpdateFrame(displayObject: DisplayObject): void;
        writeDirtyAssets(displayObject: DisplayObject): void;
        writeDrawToBitmap(bitmapData: flash.display.BitmapData, source: Shumway.Remoting.IRemotable, matrix?: flash.geom.Matrix, colorTransform?: flash.geom.ColorTransform, blendMode?: string, clipRect?: flash.geom.Rectangle, smoothing?: boolean): void;
        private _writeMatrix(matrix);
        private _writeRectangle(bounds);
        private _writeAsset(asset);
        private _writeFilters(filters);
        private _writeColorTransform(colorTransform);
        writeRequestBitmapData(bitmapData: BitmapData): void;
    }
    interface FocusEventData {
        type: FocusEventType;
    }
    class PlayerChannelDeserializer {
        input: IDataInput;
        inputAssets: any[];
        read(): any;
        private _readFocusEvent();
        private _readMouseEvent();
        private _readKeyboardEvent();
    }
}
declare module Shumway.Player {
    import flash = Shumway.AVM2.AS.flash;
    import DataBuffer = Shumway.ArrayUtilities.DataBuffer;
    import BitmapData = flash.display.BitmapData;
    import IBitmapDataSerializer = flash.display.IBitmapDataSerializer;
    import IAssetResolver = Timeline.IAssetResolver;
    import IFSCommandListener = flash.system.IFSCommandListener;
    import IVideoElementService = flash.net.IVideoElementService;
    import IRootElementService = flash.display.IRootElementService;
    import ICrossDomainSWFLoadingWhitelist = flash.system.ICrossDomainSWFLoadingWhitelist;
    import VideoControlEvent = Shumway.Remoting.VideoControlEvent;
    import VideoPlaybackEvent = Shumway.Remoting.VideoPlaybackEvent;
    import DisplayParameters = Shumway.Remoting.DisplayParameters;
    import IGFXService = Shumway.Remoting.IGFXService;
    import IGFXServiceObserver = Shumway.Remoting.IGFXServiceObserver;
    class GFXServiceBase implements IGFXService {
        _observers: IGFXServiceObserver[];
        addObserver(observer: IGFXServiceObserver): void;
        removeObserver(observer: IGFXServiceObserver): void;
        update(updates: DataBuffer, assets: any[]): void;
        updateAndGet(updates: DataBuffer, assets: any[]): any;
        frame(): void;
        videoControl(id: number, eventType: VideoControlEvent, data: any): any;
        registerFont(syncId: number, data: any): Promise<any>;
        registerImage(syncId: number, symbolId: number, data: any): Promise<any>;
        fscommand(command: string, args: string): void;
        processUpdates(updates: DataBuffer, assets: any[]): void;
        processDisplayParameters(displayParameters: DisplayParameters): void;
        processVideoEvent(id: number, eventType: VideoPlaybackEvent, data: any): void;
    }
    class Player implements IBitmapDataSerializer, IFSCommandListener, IVideoElementService, IAssetResolver, IRootElementService, ICrossDomainSWFLoadingWhitelist {
        _stage: flash.display.Stage;
        private _loader;
        private _loaderInfo;
        private _frameTimeout;
        private _eventLoopIsRunning;
        private _framesPlayed;
        private _writer;
        private _gfxService;
        private _gfxServiceObserver;
        defaultStageColor: number;
        movieParams: Map<string>;
        stageAlign: string;
        stageScale: string;
        displayParameters: DisplayParameters;
        private _lastPumpTime;
        _isPageVisible: boolean;
        _hasFocus: boolean;
        _currentMouseTarget: flash.display.InteractiveObject;
        private _pageUrl;
        private _swfUrl;
        private _loaderUrl;
        constructor(gfxService: IGFXService);
        stage: flash.display.Stage;
        private _shouldThrottleDownRendering();
        private _shouldThrottleDownFrameExecution();
        pageUrl: string;
        loaderUrl: string;
        swfUrl: string;
        load(url: string, buffer?: ArrayBuffer): void;
        private createLoaderContext();
        private _pumpDisplayListUpdates();
        syncDisplayObject(displayObject: flash.display.DisplayObject, async?: boolean): DataBuffer;
        requestBitmapData(bitmapData: BitmapData): DataBuffer;
        drawToBitmap(bitmapData: flash.display.BitmapData, source: Shumway.Remoting.IRemotable, matrix?: flash.geom.Matrix, colorTransform?: flash.geom.ColorTransform, blendMode?: string, clipRect?: flash.geom.Rectangle, smoothing?: boolean): void;
        registerEventListener(id: number, listener: (eventType: VideoPlaybackEvent, data: any) => void): void;
        notifyVideoControl(id: number, eventType: VideoControlEvent, data: any): any;
        executeFSCommand(command: string, args: string): void;
        requestRendering(): void;
        private _pumpUpdates();
        private _leaveSyncLoop();
        private _getFrameInterval();
        private _enterEventLoop();
        private _enterRootLoadingLoop();
        private _eventLoopTick();
        private _tracePlayer();
        private _leaveEventLoop();
        private _playAllSymbols();
        registerFont(symbol: Timeline.EagerlyResolvedSymbol, data: any): void;
        registerImage(symbol: Timeline.EagerlyResolvedSymbol, data: any): void;
        private _crossDomainSWFLoadingWhitelist;
        addToSWFLoadingWhitelist(domain: string, insecure: boolean): void;
        checkDomainForSWFLoading(domain: string): boolean;
    }
}
declare module Shumway {
    import AVM2 = Shumway.AVM2.Runtime.AVM2;
    import ExecutionMode = Shumway.AVM2.Runtime.ExecutionMode;
    enum AVM2LoadLibrariesFlags {
        Builtin = 1,
        Playerglobal = 2,
        Shell = 4,
    }
    function createAVM2(libraries: AVM2LoadLibrariesFlags, sysMode: ExecutionMode, appMode: ExecutionMode): Promise<AVM2>;
}
declare module Shumway.Player {
    class ShumwayComExternalInterface implements IExternalInterfaceService {
        private _externalCallback;
        enabled: boolean;
        initJS(callback: (functionName: string, args: any[]) => any): void;
        registerCallback(functionName: string): void;
        unregisterCallback(functionName: string): void;
        eval(expression: string): any;
        call(request: string): any;
        getId(): string;
    }
    class ShumwayComFileLoadingService implements IFileLoadingService {
        private _baseUrl;
        private _nextSessionId;
        private _sessions;
        init(baseUrl: string): void;
        private _notifySession(session, args);
        createSession(): FileLoadingSession;
        resolveUrl(url: string): string;
        navigateTo(url: any, target: any): void;
    }
    class ShumwayComClipboardService implements IClipboardService {
        setClipboard(data: string): void;
    }
    class ShumwayComTelemetryService implements ITelemetryService {
        reportTelemetry(data: any): void;
    }
    class BrowserFileLoadingService implements IFileLoadingService {
        private _baseUrl;
        private _fileReadChunkSize;
        createSession(): {
            open: (request: any) => void;
        };
        init(baseUrl: string, fileReadChunkSize?: number): void;
        resolveUrl(url: string): string;
        navigateTo(url: string, target: string): void;
    }
    class ShumwayComResourcesLoadingService implements ISystemResourcesLoadingService {
        private _pendingPromises;
        constructor(preload: boolean);
        private _onSystemResourceCallback(id, data);
        load(id: SystemResourceId): Promise<any>;
    }
    class BrowserSystemResourcesLoadingService implements ISystemResourcesLoadingService {
        builtinPath: string;
        viewerPlayerglobalInfo: {
            abcs: string;
            catalog: string;
        };
        shellPath: string;
        constructor(builtinPath: string, viewerPlayerglobalInfo?: {
            abcs: string;
            catalog: string;
        }, shellPath?: string);
        load(id: SystemResourceId): Promise<any>;
        private _promiseFile(path, responseType);
    }
}
declare module Shumway.Player.Window {
    import DataBuffer = Shumway.ArrayUtilities.DataBuffer;
    import VideoControlEvent = Shumway.Remoting.VideoControlEvent;
    class WindowGFXService extends GFXServiceBase {
        private _window;
        private _parent;
        private _fontOrImageRequests;
        constructor(window: any, parent?: any);
        update(updates: DataBuffer, assets: any[]): void;
        updateAndGet(updates: DataBuffer, assets: any[]): any;
        frame(): void;
        videoControl(id: number, eventType: VideoControlEvent, data: any): any;
        private _sendSyncMessage(message);
        registerFont(syncId: number, data: any): Promise<any>;
        registerImage(syncId: number, symbolId: number, data: any): Promise<any>;
        fscommand(command: string, args: string): void;
        private onWindowMessage(data);
    }
}
declare module Shumway.Player.Test {
    import DataBuffer = Shumway.ArrayUtilities.DataBuffer;
    import VideoControlEvent = Shumway.Remoting.VideoControlEvent;
    class TestGFXService extends GFXServiceBase {
        private _worker;
        private _fontOrImageRequests;
        constructor();
        update(updates: DataBuffer, assets: any[]): void;
        updateAndGet(updates: DataBuffer, assets: any[]): any;
        frame(): void;
        videoControl(id: number, eventType: VideoControlEvent, data: any): any;
        registerFont(syncId: number, data: any): Promise<any>;
        registerImage(syncId: number, symbolId: number, data: any): Promise<any>;
        fscommand(command: string, args: string): void;
        private _onWorkerMessage(e);
    }
}
declare module Shumway.Player.Test {
    class FakeSyncWorker {
        static WORKER_PATH: string;
        private static _singelton;
        static instance: FakeSyncWorker;
        private _onmessageListeners;
        private _onsyncmessageListeners;
        constructor();
        addEventListener(type: string, listener: any, useCapture?: boolean): void;
        removeEventListener(type: string, listener: any, useCapture?: boolean): void;
        postMessage(message: any, ports?: any): any;
        postSyncMessage(message: any, ports?: any): any;
    }
}
