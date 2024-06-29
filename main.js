const { Plugin, PluginSettingTab, Setting, ItemView, setIcon } = require('obsidian');

///////////////////////////////// 参数配置 ///////////////////////////////////

// 多语言配置
const langMap = {
	"en": {
    //settings
		"Replacing the Default Settings": "Replacing the Default Settings",
    "Replaces the default settings modal with a floating panel.": "Replaces the default settings modal with a floating panel.",
    "Default Floating Panel Size": "Default Floating Panel Size",
    "Default width and height of the float settings panel.": "Default width and height of the float settings panel.",
    "Force display to specified size": "Force display to specified size",
    "Strictly follow the specified width and height display, the default will be automatically adjusted according to the remaining space, the specified width and height is just a reference.": "Strictly follow the specified width and height display, the default will be automatically adjusted according to the remaining space, the specified width and height is just a reference.",
    "Waiting for the Hover Editor to Load":"Waiting for the Hover Editor to Load",
    "The unit is seconds. If this time is exceeded, it is assumed that the hover editor is not installed or enabled.": "The unit is seconds. If this time is exceeded, it is assumed that the hover editor is not installed or enabled.",
    "The unit is seconds.":"The unit is seconds.",
    "Notice me when Hover Editor not enabled or installed":"Notice me when Hover Editor not enabled or installed",
    "If Hover Editor is not installed or enabled, obsidian will notify me every time it starts.": "If Hover Editor is not installed or enabled, obsidian will notify me every time it starts.",
    "Floating Plug-Ins Market":"Floating Plug-Ins Market",
    "Once enabled, opening the plugin market will also use the floating panel.": "Once enabled, opening the plugin market will also use the floating panel.",
    "Plugin Market allows Multiple Instances": "Plugin Market allows Multiple Instances",
    "Multiple plug-in marketplace floating windows can be opened.": "Multiple plug-in marketplace floating windows can be opened.",
    "Sidebar selected tabs, auto-scroll to visual area": "Sidebar selected tabs, auto-scroll to visual area",
    "When you open the setting, the last selected tab automatically scrolls to the visual area.": "When you open the setting, the last selected tab automatically scrolls to the visual area.",
    "Left sidebar can be displayed or hidden": "Left sidebar can be displayed or hidden",
    "Click the button in the upper right corner of the left sidebar to show or hide the left sidebar.": "Click the button in the upper right corner of the left sidebar to show or hide the left sidebar.",
    "Note: All of the above actions take effect the next time you open the Settings panel!": "Note: All of the above actions take effect the next time you open the Settings panel!",
    //plugin
    "Open the Floating Settings": "Open the Floating Settings",
    "Hover Editor is required for this plugin to work.": "Hover Editor is required for this plugin to work.",
    //FloatSettingView
    "Settings" : "Settings",
    "Plugin Market": "Plugin Market",
	},
  "zh-cn": {
    "Replacing the Default Settings": "替换默认设置",
    "Replaces the default settings modal with a floating panel.": "替换默认的设置窗口为悬浮面板。",
    "Default Floating Panel Size": "悬浮窗口默认大小",
    "Default width and height of the float settings panel.": "悬浮窗口默认宽度和高度。",
    "Force display to specified size": "强制按照指定大小显示",
    "Strictly follow the specified width and height display, the default will be automatically adjusted according to the remaining space, the specified width and height is just a reference.": "严格按照指定的宽高显示，默认会自动根据剩余空间调整，指定宽高只是参考。",
    "Waiting for the Hover Editor to Load":"等待Hover Editor加载的时间",
    "The unit is seconds. If this time is exceeded, it is assumed that the hover editor is not installed or enabled.": "单位是秒，如果超过这个时间，则认为hover editor未安装或未开启。",
    "The unit is seconds.":"单位：秒",
    "Notice me when Hover Editor not enabled or installed":"未安装或未开启Hover Editor时通知我",
    "If Hover Editor is not installed or enabled, obsidian will notify me every time it starts.": "如果Hover Editor未安装或未开启，obsidian启动时会通知我。",
    "Floating Plug-Ins Market":"悬浮插件市场",
    "Once enabled, opening the plugin market will also use the floating panel.": "开启后，打开插件市场也会使用悬浮面板。",
    "Plugin Market allows Multiple Instances": "插件市场允许多实例",
    "Multiple plug-in marketplace floating windows can be opened.": "可以打开多个插件市场浮动窗口。",
    "Sidebar selected tabs, auto-scroll to visual area": "侧边栏选中标签，自动滚动到可视区域",
    "When you open the setting, the last selected tab automatically scrolls to the visual area.": "打开设置时，上次选中的标签自动滚动到可视区域。",
    "Left sidebar can be displayed or hidden": "左侧栏可显示或隐藏",
    "Click the button in the upper right corner of the left sidebar to show or hide the left sidebar.": "点击左侧栏右上角的按钮可显示或隐藏左侧栏。",
    "Note: All of the above actions take effect the next time you open the Settings panel!": "注意：以上操作均为下次打开时生效！",
    //plugin
    "Open the Floating Settings": "打开悬浮设置",
    "Hover Editor is required for this plugin to work.": "依赖插件Hover Editor未安装或未开启",
    //FloatSettingView
    "Settings" : "设置",
    "Plugin Market": "插件市场",
	},
}

// 设置默认值
const DEFAULT_SETTINGS = {
  isReplaceDefaultSettings: true,
  width: 900,
  height: 600,
  maxWaitTime: 10,
  isHoverEditorNotice: true,
  isFloatMarket: true,
  isMarketMultiIns: true,
  isAutoScroll: true,
  isAllowShowHide: true,
};

// 悬浮设置视图类型
const FLOAT_SETTING_VIEW_TYPE = "floating-settings";
// 悬浮设置视图类名
const FLOAT_SETTING_POPOVER_CLASS = "floating-settings-popover";
// 悬浮插件市场视图类型
const FLOAT_PLUGIN_MARKET_VIEW_TYPE = "floating-plugin-market";
// 悬浮插件市场视图类名
const FLOAT_PLUGIN_MARKET_POPOVER_CLASS = "floating-plugin-market-popover";


///////////////////////////////// 插件主体 ///////////////////////////////////

module.exports = class extends Plugin {
  // 当前popover实例
  popover = null;
  // 当前popover所在leaf
  popoverLeaf = null;
  // 插件市场popover实例
  lastMarketPopover = null;
  // 插件市场popover所在leaf
  lastMarketPopoverLeaf = null;
  // 插件市场激活popover
  marketActivePopovers = [];
  // 所有激活popover
  allActivePopovers = [];
  // 默认打开设置面板函数
  originSettingOpen = this.app.setting.open.bind(this.app.setting);
  // 打开悬浮设置视图函数
  floatingSettingOpen = () => { this.openFloatingSettingsView(); }

  // 默认设置面板onClose
  originalOnClose = this.app.setting.onClose.bind(this.app.setting);

  // 默认打开设置面板tab函数
  originalOpenTab = this.app.setting.openTab.bind(this.app.setting);

  async onload() {
    // 加载配置文件
    await this.loadSettings();

    // 注册打开当前文档到置顶窗口命令
    this.addCommand({
			id: "open-the-floating-settings",
			name: t("Open the Floating Settings"),
			callback: () => {
        this.openFloatingSettingsView();
			},
		});

    // 注册悬浮设置视图
    if(!this.app.viewRegistry.getViewCreatorByType(FLOAT_SETTING_VIEW_TYPE)){
      this.registerView(
        FLOAT_SETTING_VIEW_TYPE,
        (leaf) => new FloatSettingView(leaf, this)
      );
    }

    // 注册插件市场视图
    if(!this.app.viewRegistry.getViewCreatorByType(FLOAT_PLUGIN_MARKET_VIEW_TYPE)){
      this.registerView(
        FLOAT_PLUGIN_MARKET_VIEW_TYPE,
        (leaf) => new FloatPluginMarketView(leaf, this)
      );
    }

    // 替换默认设置面板
    if(this.settings.isReplaceDefaultSettings) this.app.setting.open = this.floatingSettingOpen;

    // 监听布局加载完成事件
    this.app.workspace.onLayoutReady(async () => {
      // 等待HoverEditor加载
      if(!this.hoverEditor()){
        // 等待Hover Editor加载完成
        const delay = 100;
        const times = Math.ceil((this.settings.maxWaitTime * 1000) / delay);
        let count = 0;
        for(;;) {
          if(this.hoverEditor()){
            break;
          }
          if(count >= times) {
            if (this.settings.isHoverEditorNotice) new Notice(t("Hover Editor is required for this plugin to work."));
            break;
          }
          await sleep(delay);
          count++;
        }
      }
    });

    // 监听默认设置关闭事件，关闭设置面板同时关闭悬浮设置面板(开发时对app.setting的修改，恢复理想状态需要重启)
    this.app.setting.onClose = () => {
      this.originalOnClose();
      if(this.popover) this.popover.hide();
    };

    // 重置openTab事件(开发时对app.setting的修改，恢复理想状态需要重启)
    this.app.setting.openTab = async (tab) => {
      this.originalOpenTab(tab);
      // 监听about标签的注册和购买按钮事件
      if(tab.id === "about"){
        const registerBtnText = i18next.t("plugins.sync.button-sign-up");
        const buyBtnText = i18next.t("plugins.sync.button-purchase-subscription");
        await sleep(100);
        tab.containerEl.querySelectorAll(".setting-item-control button").forEach(button => {
          if(button.textContent === registerBtnText || button.textContent === buyBtnText) {
            if(this.app.plugins.plugins['surfing']){
              button.addEventListener('click', async () => {
                await sleep(40);
                this.hoverEditor().dockPopoverToWorkspace(this.app.workspace.activeLeaf);
                this.popover.titleEl.querySelector(".popover-title").textContent = t("Settings");
              });
            }
          }
        });
      }
      // 监听插件市场，浏览按钮事件
      if(tab.id === "community-plugins" && this.settings.isFloatMarket){
        const browseBtnText = i18next.t("setting.third-party-plugin.button-browse");
        await sleep(100);
        tab.containerEl.parentElement.addEventListener('click', async (event) => {
          // 是否插件列表被点击
          const isPluginItem = (event.target.classList.contains("setting-item-info") || event.target.closest(".setting-item-info")) &&
            event.target.closest(".installed-plugins-container");
          // 是否浏览被点击或插件列表被点击
          if((event.target.textContent === browseBtnText || isPluginItem)  && this.settings.isFloatMarket) {
            if(!this.popover || !this.popover.hoverEl.contains(event.target)) return;
            // 暂时隐藏插件市场
            //document.body.classList.add("with-plugin-market-hide");
            // onShow回调
            const onShow = (popover, leaf) => {
              // 插件详情页绑定事件
              const marketDetailBindEvent = (marketDetail)=>{
                if(!marketDetail?.getAttribute("data-bind")){
                  const optionText = i18next.t("setting.options");
                  const hotkeyText = i18next.t("setting.hotkeys.name");
                  const enableBtnText = i18next.t("setting.third-party-plugin.button-enable");
                  const disabledBtnText = i18next.t("setting.third-party-plugin.button-disable");
                  const installBtnText = i18next.t("setting.third-party-plugin.button-install");
                  const uninstallBtnText = i18next.t("setting.third-party-plugin.label-uninstall");
                  marketDetail.addEventListener('click', async (event) => {
                    // 监听选项和快捷键按钮
                    if(event.target.textContent === optionText || event.target.textContent === hotkeyText){
                      // 没有替换默认设置面板时，在popover插件市场里点击选项等，需要调用打开悬浮设置面板
                      if(!this.settings.isReplaceDefaultSettings) {
                        // 先关闭默认设置的modal面板
                        document.body.findAll(".modal-container:has(.mod-settings) .modal-bg")
                          .find(item => !item?.closest(".floating-settings-popover"))?.click();
                        // 再打开悬浮设置面板
                        this.openFloatingSettingsView();
                      }
                    }
                    //监听设置面板的禁用和卸载按钮
                    if(event.target.textContent === disabledBtnText || event.target.textContent === enableBtnText || event.target.textContent === uninstallBtnText){
                      if(app.setting.lastTabId === "community-plugins"){
                        await sleep(100)
                        this.popover.hoverEl.querySelector(".vertical-tab-content-container .search-input-container input").trigger("input");
                      }
                    }
                    //监听安装按钮
                    if(event.target.textContent === installBtnText){
                      const observer = new MutationObserver((mutationsList) => {
                        for(const mutation of mutationsList) {
                            if (mutation.type === 'childList') {
                                setTimeout(() => {
                                  this.popover.hoverEl.querySelector(".vertical-tab-content-container .search-input-container input").trigger("input");
                                }, 100);
                                observer.disconnect();
                            }
                        }
                      });
                      observer.observe(marketDetail, { childList: true });
                    }
                  });
                  marketDetail.setAttr("data-bind", true);
                }
              };
              let marketDetail = popover.hoverEl.querySelector(".community-modal-details");
              if(marketDetail){
                marketDetailBindEvent(marketDetail);
              } else {
                popover.hoverEl.querySelector(".community-modal-search-results").addEventListener('click', ()=>{
                  marketDetail = popover.hoverEl.querySelector(".community-modal-details");
                  marketDetailBindEvent(marketDetail);
                });
              }
              // 恢复隐藏插件市场
              //document.body.classList.remove("with-plugin-market-hide");
            };
            // 打开插件市场面板
            this.openFloatingPluginMarketView(onShow);
          }
          // 监听插件市场的开启关闭插件按钮和删除插件按钮
          const delBtnText = i18next.t("setting.third-party-plugin.label-uninstall");
          if((event.target.classList.contains("checkbox-container") && event.target.closest(".installed-plugins-container")) ||
            (event.target.getAttribute("aria-label") === delBtnText && event.target.closest(".installed-plugins-container"))
          ) {
            if(this.marketActivePopovers.length > 0) {
              // 更新插件市场详情
              const updateMarketDetail = () => {
                this.marketActivePopovers.forEach(popover => {
                  // 更新列表
                  const searchInput = popover.hoverEl.querySelector(".search-input-container input");
                  if(searchInput) searchInput.trigger("input");
                  // 更新详情页面
                  const selectedItem = popover.hoverEl.querySelector(".community-modal-search-results .community-item.is-selected");
                  if(selectedItem) selectedItem.click();
                });
              }
              if(event.target.getAttribute("aria-label") === delBtnText){
                await sleep(100);
                const uninstallBtn = document.querySelector(".modal-container.mod-confirmation.mod-dim");
                uninstallBtn.addEventListener('click', async (event) => {
                  if(event.target.textContent === delBtnText) {
                    await sleep(100);
                    updateMarketDetail();
                  }
                }, {once: true});
              } else {
                await sleep(100);
                updateMarketDetail();
              }
            }
          }
        });
      }
    };

    // 添加配置面板
    this.addSettingTab(new FloatingSettingsSettingTab(this.app, this));
  }
  onunload() {
    this.app.workspace.detachLeavesOfType(FLOAT_SETTING_VIEW_TYPE);
    this.app.setting.open = this.originSettingOpen;
    this.app.setting.onClose = this.originalOnClose;
    this.app.setting.openTab = this.originalOpenTab;
  }

  async loadSettings() {
    this.settings = Object.assign(
      {},
      DEFAULT_SETTINGS,
      await this.loadData()
    );
  }
  async saveSettings() {
    await this.saveData(this.settings);
  }

  // 获取Hover Editor插件实例
  hoverEditor() {
    return this.app.plugins.plugins['obsidian-hover-editor'];
  }

  // 打开悬浮设置视图
  async openFloatingSettingsView(onShow = ()=>{}) {
    const hoverEditor = this.hoverEditor();
    // 未开启或安装hover editor则使用默认设置面板打开
    if(!hoverEditor) {
      this.originSettingOpen();
      return;
    }
    if(!document.querySelector('.' + FLOAT_SETTING_POPOVER_CLASS)){
      // 创建leaf和视图
      const leaf = app.workspace.createLeafInParent(app.workspace.floatingSplit);
      await leaf.setViewState({
        type: FLOAT_SETTING_VIEW_TYPE,
        active: false,
      });
      this.popoverLeaf = leaf;
      // 把leaf转换为悬浮面板
      app.setting.openTabById(app.setting.lastTabId||app.setting.settingTabs[0]?.id);
      this.convertLeafToPopover(leaf, async () => {
        // 获取当前悬浮窗实例
        const lastPopover = hoverEditor.activePopovers.last();
        // 绑定最小化按钮函数
        lastPopover.toggleMinimized = this.toggleMinimized.bind(lastPopover);
        // 赋值弹窗本次实例
        this.popover = lastPopover;
        // 赋值激活的popover
        this.allActivePopovers.push(lastPopover);
        //设置弹窗信息
        const setPopoverReact = async () => {
          await nextFrame();
          // 设置宽高
          lastPopover.hoverEl.style.width = this.settings.width+'px';
          const height = Number(this.settings.height) >= window.innerHeight ? window.innerHeight * 0.8 : this.settings.height;
          lastPopover.hoverEl.style.height = height+'px';
          // 设置坐标
          const realStyle = getComputedStyle(lastPopover.hoverEl, null);
          const top = (window.innerHeight - parseFloat(realStyle.height))/2;
          lastPopover.hoverEl.style.top = (top > 0 ? top : 0) + 'px';
          const left = (window.innerWidth - parseFloat(realStyle.width))/2;
          lastPopover.hoverEl.style.left= (left > 0 ? left : 0) + 'px';
          lastPopover.hoverEl.setAttribute("data-x", String(left));
          lastPopover.hoverEl.setAttribute("data-y", String(top));
        };
        // 设置弹窗样式
        lastPopover.hoverEl.classList.add(FLOAT_SETTING_POPOVER_CLASS);
        setIcon(lastPopover.pinEl, "settings");
        setPopoverReact();
        //判断是应该置于modal窗口之上
        this.shouldOverModal(lastPopover);

        // 设置显示隐藏按钮
        const setShowHideBtn = () => {
          // settings panel style
          if(this.settings.isAllowShowHide){
            // 添加显示隐藏按钮
            if(app.setting.contentEl.querySelector(".side-show-hide-btn")) return;
            const showHideBtn = createDiv({cls: "side-show-hide-btn"});
            setIcon(showHideBtn, "menu");
            showHideBtn.onclick = () => {
              if(app.setting.tabHeadersEl.classList.contains("with-hide")){
                // 显示侧边栏
                app.setting.tabHeadersEl.classList.remove("with-hide");
                // 滚动选中标签到可视区域
                if(this.settings.isAutoScroll && !isInParentViewport(app.setting.activeTab.navEl, app.setting.tabHeadersEl)) {
                  app.setting.activeTab.navEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
              } else {
                // 隐藏侧边栏
                app.setting.tabHeadersEl.classList.add("with-hide");
              }
            }
            app.setting.tabContentContainer.classList.add("with-show-hide-btn");
            app.setting.contentEl.insertBefore(showHideBtn, app.setting.tabContentContainer);
          }
        }
        setShowHideBtn();

        //滚动侧边栏选中标签
        if(app.setting.activeTab.navEl && this.settings.isAutoScroll){
          app.setting.activeTab.navEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }

        // popover标题点击事件
        lastPopover.titleEl.addEventListener('click', () => {
          this.activePopover(leaf, lastPopover);
        });

        // setting-search插件 默认选中
        document.querySelector(".settings-search-input input[type=search]")?.select();

        // onShow回调函数
        if(typeof onShow === 'function') onShow(lastPopover, leaf);
      });
    } else {
      //激活弹窗
      if(this.popoverLeaf && this.popover) {
        this.activePopover(this.popoverLeaf, this.popover);
        this.restorePopover(this.popover);
      }
    }
  }

  // 打开悬浮插件市场视图
  async openFloatingPluginMarketView(onShow = ()=>{}) {
    const hoverEditor = this.hoverEditor();
    // 未开启或安装hover editor则使用默认设置面板打开
    if(!hoverEditor) {
      //document.body.classList.remove("with-plugin-market-hide");
      return;
    }
    // 如果单实例，则激活上次的popover
    if(!this.settings.isMarketMultiIns && document.querySelector('.' + FLOAT_PLUGIN_MARKET_POPOVER_CLASS)) {
      const marketModal = document.querySelector(".modal-container .mod-community-modal");
      if(marketModal){
        const modalBg = marketModal.parentElement.querySelector(".modal-bg");
        modalBg?.click();
      }
      //document.body.classList.remove("with-plugin-market-hide");
      this.activePopover(this.lastMarketPopoverLeaf, this.lastMarketPopover);
      this.restorePopover(this.lastMarketPopover);
      return;
    }
    // 创建leaf和视图
    const leaf = app.workspace.createLeafInParent(app.workspace.floatingSplit);
    await leaf.setViewState({
      type: FLOAT_PLUGIN_MARKET_VIEW_TYPE,
      active: false,
    });
    this.lastMarketPopoverLeaf = leaf;
    this.convertLeafToPopover(leaf, async () => {
      // 获取当前悬浮窗实例
      const lastPopover = hoverEditor.activePopovers.last();
      // 绑定最小化按钮函数
      lastPopover.toggleMinimized = this.toggleMinimized.bind(lastPopover);
      // 赋值弹窗本次实例
      this.lastMarketPopover = lastPopover;
      // 赋值插件市场激活的popover
      this.marketActivePopovers.push(lastPopover);
      // 赋值全部激活popover
      this.allActivePopovers.push(lastPopover);
      //设置弹窗信息
      const setPopoverReact = async () => {
        await nextFrame();
        // 设置宽高
        lastPopover.hoverEl.style.width = this.settings.width+'px';
        const height = Number(this.settings.height) >= window.innerHeight ? window.innerHeight * 0.8 : this.settings.height;
        lastPopover.hoverEl.style.height = height+'px';
        // 设置坐标
        const realStyle = getComputedStyle(lastPopover.hoverEl, null);
        const top = (window.innerHeight - parseFloat(realStyle.height))/2;
        lastPopover.hoverEl.style.top = (top > 0 ? top : 0) + 'px';
        const left = (window.innerWidth - parseFloat(realStyle.width))/2;
        lastPopover.hoverEl.style.left= (left > 0 ? left : 0) + 'px';
        lastPopover.hoverEl.setAttribute("data-x", String(left));
        lastPopover.hoverEl.setAttribute("data-y", String(top));
      };
      // 设置弹窗样式
      lastPopover.hoverEl.classList.add(FLOAT_PLUGIN_MARKET_POPOVER_CLASS);
      setIcon(lastPopover.pinEl, "plug");
      setPopoverReact();
      //判断是应该置于modal窗口之上
      this.shouldOverModal(lastPopover);

      // popover标题点击事件
      lastPopover.titleEl.addEventListener('click', () => {
        this.activePopover(leaf, lastPopover);
      });

      // onShow回调函数
      if(typeof onShow === 'function') onShow(lastPopover, leaf);
    });
  }

  // 把leaf转换为悬浮面板
  convertLeafToPopover(oldLeaf, onShow) {
    if (!oldLeaf) return;
    const newLeaf = this.hoverEditor().spawnPopover(undefined, () => {
      const { parentSplit: newParentSplit } = newLeaf;
      const { parentSplit: oldParentSplit } = oldLeaf;
      oldParentSplit.removeChild(oldLeaf);
      newParentSplit.replaceChild(0, oldLeaf, true);
      this.app.workspace.setActiveLeaf(oldLeaf, false, true);
      if(typeof onShow === 'function') onShow();
    });
    return newLeaf;
  }

  // 激活悬浮窗
  isActivating = false;
  async activePopover(leaf, popover) {
    if(this.isActivating) return;
    if(!leaf || !popover) return;
    //判断是应该置于modal窗口之上
    this.shouldOverModal(popover);
    // 如果已激活返回
    if(popover.hoverEl.classList.contains("is-active")) return;
    this.isActivating = true;
    // 取消上一次激活的popover焦点
    this.hoverEditor().activePopovers.find(hover=>hover?.hoverEl?.classList?.contains("is-active"))?.hoverEl?.removeClass("is-active");
    // 激活当前popover
    popover.hoverEl.addClass("is-active");
    // 根据leaf信息，设置当前焦点的窗口信息
    const titleEl = popover.hoverEl.querySelector(".popover-title");
    if (!titleEl) { this.isActivating = false; return };
    titleEl.textContent = leaf.view?.getDisplayText();
    if (leaf?.view?.getViewType()) {
      popover.hoverEl.setAttribute("data-active-view-type", leaf.view.getViewType());
    }
    if (leaf.view?.file?.path) {
      titleEl.setAttribute("data-path", leaf.view.file.path);
    } else {
      titleEl.removeAttribute("data-path");
    }
    // 监听document点击事件
    const listenDocumentClick = () => {
      document.addEventListener('click', (event) => {
        // 点击类型，当前popover，其他popover, 特殊按钮，其他
        const targetPopover = event.target.closest(".hover-popover.hover-editor");
        //  如果不在当前popover
        if(popover.hoverEl !== targetPopover) {
          // targetPopover null或 在别的popover中，并且被点击的按钮不是 打开悬浮设置按钮(一般是用cmdr添加的按钮)
          if(!event.target.classList.contains("floating-settings:open-the-floating-settings") &&
          !(event.target.classList.contains("lucide-maximize") || event.target.classList.contains("lucide-minimize")) &&
            event.target.textContent !== i18next.t("setting.options") &&
            event.target.textContent !== i18next.t("setting.third-party-plugin.button-browse") &&
            !((event.target.classList.contains("setting-item-info") || event.target.closest(".setting-item-info")) && event.target.closest(".installed-plugins-container"))
          ) {
            popover.hoverEl?.removeClass("is-active");
          } else {
            // 如果被点击的按钮不是打开悬浮设置按钮，重新监听document点击事件
            listenDocumentClick();
          }
          // 在别的popover中，且不是点击的选项按钮和浏览按钮，目标窗口激活
          if(targetPopover &&
            event.target.textContent !== i18next.t("setting.options") &&
            event.target.textContent !== i18next.t("setting.third-party-plugin.button-browse")
          ) {
            targetPopover?.addClass("is-active");
          }
        } else {
          // 点击发生在在hoverEditor中，什么都不做，再次监听document点击事件
          listenDocumentClick();
        }
      }, {once: true});
    };
    listenDocumentClick();
    await sleep(100);
    this.isActivating = false;
  }

  // 恢复popover窗口
  restorePopover(popover) {
    if(!popover) return;
    if(popover.hoverEl?.classList.contains("is-minimized")) {
      popover.toggleMinimized();
    }
  }

  // 判断是否需要置于modal窗口之上
  shouldOverModal(popover) {
    // 如果是数组，则批量操作
    if(Array.isArray(popover)) {
      popover.forEach(hover=>{
        this.shouldOverModal(hover);
      });
    }
    // 当有modal窗口时，暂时退化为原始设置窗口（因为悬浮设置光标聚焦等有问题）
    if(document.querySelector(".modal-container.mod-dim:not(.modal-settings)")){
      popover?.hide();
      this.originSettingOpen();
      return;
    }
    //判断是否存在modal窗口，有modal窗口需要把弹窗zIndex设为calc(var(--layer-modal) + 1);
    if(document.querySelector(".modal-container.mod-dim:not(.modal-settings)")){
      // 如果有modal窗口，则添加with-over-modal
      if(!popover?.hoverEl?.classList?.contains("with-over-modal")) popover.hoverEl.classList.add("with-over-modal");

      // 监听modal窗口被关闭
      const observer = new MutationObserver((mutationsList) => {
        for(const mutation of mutationsList) {
            if (mutation.type === 'childList') {
                const removedNodes = Array.from(mutation.removedNodes);
                const isModalRemoved = removedNodes.some(node =>
                  node.classList.contains('modal-container') &&
                  node.classList.contains('mod-dim') &&
                  !node.classList.contains('modal-settings')
                );
                if (isModalRemoved) {
                    // modal窗口被关闭时再次检查是否需要置于modal窗口之上
                    this.shouldOverModal(popover);
                    observer.disconnect();
                }
            }
        }
      });
      observer.observe(document.body, { childList: true });
    } else {
      // 如果没有modal窗口，则移除with-over-modal
      if(popover?.hoverEl?.classList?.contains("with-over-modal")) popover.hoverEl.classList.remove("with-over-modal");
    }
  }

  // popover最小化和还原
  toggleMinimized(popover) {
    popover = popover || this;
    const hoverEl = popover.hoverEl;
    const headerHeight = popover.titleEl.offsetHeight;
    if (!hoverEl.hasAttribute("data-restore-height")) {
      hoverEl.setAttribute("data-restore-height", String(hoverEl.offsetHeight));
      hoverEl.style.minHeight = headerHeight + "px";
      hoverEl.style.maxHeight = headerHeight + "px";
      hoverEl.toggleClass("is-minimized", true);
    } else {
      const restoreHeight = hoverEl.getAttribute("data-restore-height");
      if (restoreHeight) {
        hoverEl.removeAttribute("data-restore-height");
        hoverEl.style.height = restoreHeight + "px";
      }
      hoverEl.style.removeProperty("max-height");
      hoverEl.toggleClass("is-minimized", false);
    }
  }
}

///////////////////////////////// 悬浮设置面板 ///////////////////////////////////

class FloatSettingView extends ItemView {
  icon = "settings";
  constructor(leaf, plugin) {
	  super(leaf);
    this.plugin = plugin;
  }
  getViewType() {
	  return FLOAT_SETTING_VIEW_TYPE;
  }
  getDisplayText() {
	  return t("Settings");
  }
  async onOpen() {
    const container = this.containerEl.children[1];
    container.empty();
    // 这里不是通过api或点击事件打开的，所以这里不会进入modal模式
    app.setting.modalEl.parentElement.classList.add("modal-settings");
    container.appendChild(app.setting.modalEl.parentElement);
  }
  async onClose() {
    this.plugin.popover = null;
    this.plugin.popoverLeaf = null;
    // 关闭悬浮设置面板同时关闭默认设置面板
    app.setting.close();
  }
};

///////////////////////////////// 插件市场面板 ///////////////////////////////////

class FloatPluginMarketView extends ItemView {
  icon = "plug";
  constructor(leaf, plugin) {
	  super(leaf);
    this.plugin = plugin;
  }
  getViewType() {
	  return FLOAT_PLUGIN_MARKET_VIEW_TYPE;
  }
  getDisplayText() {
	  return t("Plugin Market");
  }
  async onOpen() {
    const container = this.containerEl.children[1];
    container.empty();
    // 这里获取主要内容后取消modal模式
    const marketModal = document.querySelector(".modal-container .mod-community-modal");
    if(marketModal){
      const modalBg = marketModal.parentElement.find(".modal-bg");
      container.appendChild(marketModal);
      modalBg?.click();
    }
  }
  async onClose() {}
};

///////////////////////////////// 插件配置 ///////////////////////////////////

// 插件配置页面
class FloatingSettingsSettingTab extends PluginSettingTab {
  constructor(app, plugin) {
      super(app, plugin);
      this.plugin = plugin;
  }
  display() {
      const { containerEl } = this;
      containerEl.empty();

      // 替换默认的设置窗口为悬浮窗口
      new Setting(containerEl).setName(t("Replacing the Default Settings"))
      .setDesc(t("Replaces the default settings modal with a floating panel."))
      .addToggle((toggle) => {
        toggle.setValue(this.plugin.settings.isReplaceDefaultSettings)
        .onChange(async (value) => {
          this.plugin.settings.isReplaceDefaultSettings = value;
          await this.plugin.saveSettings();
          if(value === true){
            this.app.setting.open = this.plugin.floatingSettingOpen;
          } else {
            this.app.setting.open = this.plugin.originSettingOpen;
          }
        });
      });

      // 设置默认窗口宽高
      const windowSizeControlEl = new Setting(containerEl)
			.setName(t("Default Floating Panel Size"))
			.setDesc(t("Default width and height of the float settings panel."))
      .setClass("panel-size")
      .controlEl;
			const windowWidth = windowSizeControlEl.createEl("input", { attr: { type: "number", value: Number(this.plugin.settings.width), placeholder: "width" } });
			windowWidth.onchange = () => {
				this.plugin.settings.width = Number(windowWidth.value);
				this.plugin.saveSettings();
			}
			windowSizeControlEl.createSpan({text: "×"});
			const windowHeight = windowSizeControlEl.createEl("input", { attr: { type: "number", value: Number(this.plugin.settings.height), placeholder: "height" } });
			windowHeight.onchange = () => {
				this.plugin.settings.height = Number(windowHeight.value);
				this.plugin.saveSettings();
			}

      // 插件市场悬浮
      new Setting(containerEl).setName(t("Floating Plug-Ins Market"))
      .setDesc(t("Once enabled, opening the plugin market will also use the floating panel."))
      .addToggle((toggle) => {
        toggle.setValue(this.plugin.settings.isFloatMarket)
        .onChange(async (value) => {
          this.plugin.settings.isFloatMarket = value;
          await this.plugin.saveSettings();
        });
      });

      // 插件市场允许多实例
      new Setting(containerEl).setName(t("Plugin Market allows Multiple Instances"))
      .setDesc(t("Multiple plug-in marketplace floating windows can be opened."))
      .addToggle((toggle) => {
        toggle.setValue(this.plugin.settings.isMarketMultiIns)
        .onChange(async (value) => {
          this.plugin.settings.isMarketMultiIns = value;
          await this.plugin.saveSettings();
        });
      });

      // 左侧栏可显示隐藏
      new Setting(containerEl).setName(t("Left sidebar can be displayed or hidden"))
      .setDesc(t("Click the button in the upper right corner of the left sidebar to show or hide the left sidebar."))
      .addToggle((toggle) => {
        toggle.setValue(this.plugin.settings.isAllowShowHide)
        .onChange(async (value) => {
          this.plugin.settings.isAllowShowHide = value;
          await this.plugin.saveSettings();
        });
      });

      // 侧边栏选中标签自动滚动到可视区域
      new Setting(containerEl).setName(t("Sidebar selected tabs, auto-scroll to visual area"))
      .setDesc(t("When you open the setting, the last selected tab automatically scrolls to the visual area."))
      .addToggle((toggle) => {
        toggle.setValue(this.plugin.settings.isAutoScroll)
        .onChange(async (value) => {
          this.plugin.settings.isAutoScroll = value;
          await this.plugin.saveSettings();
        });
      });

      // 如果hover editor未安装或未开启是否提示
      new Setting(containerEl).setName(t("Notice me when Hover Editor not enabled or installed"))
      .setDesc(t("If Hover Editor is not installed or enabled, obsidian will notify me every time it starts."))
      .addToggle((toggle) => {
        toggle.setValue(this.plugin.settings.isHoverEditorNotice)
        .onChange(async (value) => {
          this.plugin.settings.isHoverEditorNotice = value;
          await this.plugin.saveSettings();
        });
      });

      // 等待hover editor加载时间
      new Setting(containerEl).setName(t("Waiting for the Hover Editor to Load"))
      .setDesc(t("The unit is seconds. If this time is exceeded, it is assumed that the hover editor is not installed or enabled."))
      .addText((text) => {
        text.setValue(this.plugin.settings.maxWaitTime)
        .setPlaceholder(t("The unit is seconds."))
        .onChange(async (value) => {
          this.plugin.settings.maxWaitTime = value;
          await this.plugin.saveSettings();
        });
      })
      .controlEl.find("input")
			.setAttr("type", "number");

      // 提醒说明
      new Setting(containerEl).setName(t("Note: All of the above actions take effect the next time you open the Settings panel!"))
  }
}

///////////////////////////////// 功能函数 ///////////////////////////////////

// 翻译文本为对应语言
function t(str) {
  const lang = moment.locale();
  if(langMap[lang] && langMap[lang][str]) {
      return langMap[lang][str];
  }
  if(langMap["en"] && langMap["en"][str]) {
    return langMap["en"][str];
  }
  return str;
}

// 判断某子元素是否在父元素可视区内
function isInParentViewport(childEl, parentEl) {
  // 获取子元素相对父元素的位置
  const childRect = childEl.getBoundingClientRect();
  const parentRect = parentEl.getBoundingClientRect();

  // 判断子元素是否在父元素的可视区域内
  // 这里假设“可视区域”指的是父元素的客户端高度和宽度范围内
  return (
    childRect.top >= parentRect.top &&
    childRect.bottom <= parentRect.bottom &&
    childRect.left >= parentRect.left &&
    childRect.right <= parentRect.right
  );
}

// 输出调试信息
function debug(data){
  console.log(data);
  if(typeof data !== 'string') {
    try{
      data = JSON.stringify(data);
    }catch(e){
      data = data.toString()
    }
  }
  new Notice(data, 0);
}