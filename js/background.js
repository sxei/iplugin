//-------------------- 右键菜单演示 ------------------------//
chrome.contextMenus.create({
	title: "测试右键菜单",
	onclick: function(){
		chrome.notifications.create(null, {
			type: 'basic',
			iconUrl: 'img/icon.png',
			title: '这是标题',
			message: '您刚才点击了自定义右键菜单！'
		});
	}
});
chrome.contextMenus.create({
	title: '使用度娘搜索：%s', // %s表示选中的文字
	contexts: ['selection'], // 只有当选中文字时才会出现此右键菜单
	onclick: function(params)
	{
		// 注意不能使用location.href，因为location是属于background的window对象
		chrome.tabs.create({url: 'https://www.baidu.com/s?ie=utf-8&wd=' + encodeURI(params.selectionText)});
	}
});



//-------------------- badge演示 ------------------------//
/*(function()
{
	var showBadge = false;
	var menuId = chrome.contextMenus.create({
		title: '显示图标上的Badge',
		type: 'checkbox',
		checked: false,
		onclick: function() {
			if(!showBadge)
			{
				chrome.browserAction.setBadgeText({text: 'New'});
				chrome.browserAction.setBadgeBackgroundColor({color: [255, 0, 0, 255]});
				chrome.contextMenus.update(menuId, {title: '隐藏图标上的Badge', checked: true});
			}
			else
			{
				chrome.browserAction.setBadgeText({text: ''});
				chrome.browserAction.setBadgeBackgroundColor({color: [0, 0, 0, 0]});
				chrome.contextMenus.update(menuId, {title: '显示图标上的Badge', checked: false});
			}
			showBadge = !showBadge;
		}
	});
})();*/

// 监听来自content-script的消息
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse)
{
	console.log('收到来自content-script的消息：');
	console.log(request, sender, sendResponse);
	sendResponse('我是后台，我已收到你的消息：' + JSON.stringify(request));
});

$('#test_cors').click((e) => {
	$.get('https://www.baidu.com', function(html){
		console.log( html);
		alert('跨域调用成功！');
	});
});

$('#get_popup_title').click(e => {
	var views = chrome.extension.getViews({type:'popup'});
	if(views.length > 0) {
		alert(views[0].document.title);
	} else {
		alert('popup未打开！');
	}
});

// 获取当前选项卡ID
function getCurrentTabId(callback)
{
	chrome.tabs.query({active: true, currentWindow: true}, function(tabs)
	{
		if(callback) callback(tabs.length ? tabs[0].id: null);
	});
}

// 当前标签打开某个链接
function openUrlCurrentTab(url)
{
	getCurrentTabId(tabId => {
		chrome.tabs.update(tabId, {url: url});
	})
}

// 新标签打开某个链接
function openUrlNewTab(url)
{
	chrome.tabs.create({url: url});
}


// 预留一个方法给popup调用
function testBackground() {
	alert('你好，我是background！');
}

// 是否显示图片
var showImage;
chrome.storage.sync.get({showImage: true}, function(items) {
	showImage = items.showImage;
});
// web请求监听，最后一个参数表示阻塞式，需单独声明权限：webRequestBlocking
chrome.webRequest.onBeforeRequest.addListener(details => {
	// cancel 表示取消本次请求
	if(!showImage && details.type == 'image') return {cancel: true};
	// 简单的音视频检测
	// 大部分网站视频的type并不是media，且视频做了防下载处理，所以这里仅仅是为了演示效果，无实际意义
	if(details.type == 'media') {
		chrome.notifications.create(null, {
			type: 'basic',
			iconUrl: 'img/icon.png',
			title: '检测到音视频',
			message: '音视频地址：' + details.url,
		});
	}
}, {urls: ["<all_urls>"]}, ["blocking"]);




//--------------------------------------//
// 以下代码本来是为了实现“关闭最后一个标签时自动打开新标签页，而不是直接关闭窗口”，
// 但是由于Chrome只提供onRemove事件，没有提供beforeRemove事件，所以当标签已经关闭时再打开新标签已经晚了，
// 所以现在采取的方式时：只要浏览器当前只有一个标签、且不是新标签页，都默默地后台自动新开一个标签页。
//--------------------------------------//

// 新标签页地址
const newTabUrl = 'chrome://newtab/';
function createNewTab() {
	chrome.tabs.query({currentWindow: true}, function(tabs) {
		// 如果当前只有一个标签，并且不是新标签页，自动打开新标签
		if(tabs.length == 1 && tabs[0].url != newTabUrl) {
			chrome.tabs.create({url: newTabUrl, active: false});
		}
	});
}
chrome.tabs.onCreated.addListener(function(tab) {
	console.log(tab);
	if(tab.url == newTabUrl) return;
	createNewTab();
});
chrome.tabs.onRemoved.addListener(function(tabId, removeInfo) {
	createNewTab();
});
// 注意onUpdated不止在地址变化时触发，页面状态的改变也会触发
chrome.tabs.onUpdated.addListener(function(tabId, changeInfo) {
	console.log(arguments);
	// changeInfo.url有值才说明是地址变化
	if(!changeInfo.url || changeInfo.url == newTabUrl) return;
	createNewTab();
});