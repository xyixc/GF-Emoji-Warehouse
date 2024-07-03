// ==UserScript==
// @name         少女前线表情包
// @namespace    test
// @version      1.0.0
// @icon         http://bbs.nga.cn/favicon.ico
// @description  少前表情脚本
// @author       P*4
// @include      /^https?://(bbs\.ngacn\.cc|nga\.178\.com|bbs\.nga\.cn|ngabbs\.com)/.+/
// @grant        GM_registerMenuCommand
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_deleteValue
// @grant        GM_xmlhttpRequest
// @connect      github.com
// @connect      raw.githubusercontent.com
// ==/UserScript==

((ui, poster) => {
    if (!ui || !poster) return;

    const hookFunction = (object, functionName, callback) => {
        ((originalFunction) => {
            object[functionName] = function () {
                const returnValue = originalFunction.apply(this, arguments);
                callback.apply(this, [returnValue, originalFunction, arguments]);
                return returnValue;
            };
        })(object[functionName]);
    };

    const updateStoredIconSetStatus = () => {
        let iconSetStatus = GM_getValue('iconSetStatus') || {};
        GM_setValue('iconSetStatus', iconSetStatus);
    };

    const fetchIconSets = () => {
        const cachedIconSets = GM_getValue('cachedIconSets');
        const cacheTimestamp = GM_getValue('cacheTimestamp');
        const now = new Date(); // 获取当前时间
        const formattedNow = `${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, '0')}${now.getDate().toString().padStart(2, '0')}${now.getHours().toString().padStart(2, '0')}`; // 格式化时间为年月日时
        const cacheDuration = 72 * 60 * 60 * 1000; // 缓存有效期为72小时

        if (cachedIconSets && cacheTimestamp && (formattedNow - cacheTimestamp < cacheDuration)) {
            // 如果缓存有效，则不更新 iconSetStatus
            const iconSets = JSON.parse(cachedIconSets);
            updateIconSetStatus(iconSets);
        } else {
            // 如果缓存无效，则重新获取数据并更新 iconSetStatus
            const urls = [
                "https://raw.githubusercontent.com/xyixc/GF-Emoji-Warehouse/main/girls_frontline.json",
                "https://raw.githubusercontent.com/xyixc/GF-Emoji-Warehouse/main/girls_frontline2.json",
                "https://raw.githubusercontent.com/xyixc/GF-Emoji-Warehouse/main/project_neural_cloud.json",
                "https://raw.githubusercontent.com/xyixc/GF-Emoji-Warehouse/main/extra_emoji.json"
            ]; // 托管文件地址

            const fetchData = (url) => {
                return new Promise((resolve, reject) => {
                    GM_xmlhttpRequest({
                        method: "GET",
                        url: url,
                        onload: function (response) {
                            if (response.status === 200) {
                                try {
                                    const parsedData = JSON.parse(response.responseText);
                                    resolve(parsedData);
                                } catch (e) {
                                    console.error("Failed to parse response:", e);
                                    reject(e);
                                }
                            } else {
                                console.error("Failed to fetch icon sets");
                                reject(new Error("Failed to fetch icon sets"));
                            }
                        },
                        onerror: function () {
                            console.error("Error occurred while fetching icon sets");
                            reject(new Error("Error occurred while fetching icon sets"));
                        }
                    });
                });
            };

            Promise.all(urls.map(fetchData)).then(dataArray => {
                const allIconSets = dataArray.reduce((acc, data) => {
                    return acc.concat(data.groups);
                }, []);

                // 比对新旧数据并更新
                if (cachedIconSets) {
                    const oldIconSets = JSON.parse(cachedIconSets);
                    const updatedIconSets = allIconSets.map(newGroup => {
                        const oldGroup = oldIconSets.find(old => old.name === newGroup.name);
                        return oldGroup ? { ...oldGroup, ...newGroup } : newGroup;
                    });
                    GM_setValue('cachedIconSets', JSON.stringify(updatedIconSets));
                } else {
                    GM_setValue('cachedIconSets', JSON.stringify(allIconSets));
                }

                GM_setValue('cacheTimestamp', formattedNow); // 更新缓存时间戳为当前时间
                updateIconSetStatus(allIconSets);
            }).catch(error => {
                console.error("Error fetching icon sets:", error);
            });
        }
    };



    // 更新存储的表情包状态
    const updateIconSetStatus = (iconSets) => {
        let iconSetStatus = GM_getValue('iconSetStatus') || {};
        iconSets.forEach(group => {
            const groupName = group.name;
            iconSetStatus[groupName] = true;
        });
        console.log('Updated iconSetStatus:', iconSetStatus);
        GM_setValue('iconSetStatus', iconSetStatus);
        console.log('Saved iconSetStatus to storage');
    };

    fetchIconSets();

    // 创建浮动窗口
    // 管理表情包
    const createSettingsWindow = () => {
        const settingsWindow = document.createElement('div');
        settingsWindow.style.position = 'fixed';
        settingsWindow.style.top = '50px';
        settingsWindow.style.right = '50px';
        settingsWindow.style.width = '300px';
        settingsWindow.style.backgroundColor = '#e9e6de';
        settingsWindow.style.padding = '20px';
        settingsWindow.style.border = '1px solid #000';
        settingsWindow.style.zIndex = '999';

        const closeBtn = document.createElement('button');
        closeBtn.innerText = '关闭';
        closeBtn.style.position = 'absolute';
        closeBtn.style.top = '2px';
        closeBtn.style.right = '5px';
        closeBtn.onclick = () => {
            document.body.removeChild(settingsWindow);
        };
        settingsWindow.appendChild(closeBtn);

        const table = document.createElement('table');
        table.style.width = '100%';

        const iconSets = JSON.parse(GM_getValue('cachedIconSets'));

        iconSets.forEach(group => {
            const groupName = group.name;

            const row = table.insertRow();

            const nameCell = row.insertCell(0);
            nameCell.innerText = groupName;

            const enableCell = row.insertCell(1);
            const enableCheckbox = document.createElement('input');
            enableCheckbox.type = 'checkbox';
            enableCheckbox.checked = true; // 默认全选
            enableCell.appendChild(enableCheckbox);

            enableCheckbox.addEventListener('change', (event) => {
                const isEnabled = event.target.checked;

                let iconSetStatus = GM_getValue('iconSetStatus') || {};
                iconSetStatus[groupName] = isEnabled;
                GM_setValue('iconSetStatus', iconSetStatus);

                const statusMessage = document.createElement('div');
                statusMessage.textContent = `${groupName}已${isEnabled ? '启用' : '禁用'}`;
                statusMessage.style.position = 'fixed';
                statusMessage.style.top = '10px';
                statusMessage.style.left = '10px';
                statusMessage.style.backgroundColor = isEnabled ? '#4CAF50' : '#f44336';
                statusMessage.style.padding = '10px';
                statusMessage.style.borderRadius = '5px';
                statusMessage.style.transition = 'opacity 1s ease-in-out';

                document.body.appendChild(statusMessage);

                setTimeout(() => {
                    statusMessage.style.opacity = '0';
                    setTimeout(() => {
                        document.body.removeChild(statusMessage);
                    }, 1000);
                }, 1500);
            });

            let iconSetStatus = GM_getValue('iconSetStatus') || {};
            enableCheckbox.checked = iconSetStatus[groupName];
        });

        settingsWindow.appendChild(table);

        document.body.appendChild(settingsWindow);
    };

    GM_registerMenuCommand('设置', () => {
        createSettingsWindow();
    });

    GM_registerMenuCommand('获取更新', () => {
        GM_deleteValue('cachedIconSets');
        GM_deleteValue('cacheTimestamp');

        const statusMessage = document.createElement('div');
        statusMessage.textContent = '请刷新网页';
        statusMessage.style.position = 'fixed';
        statusMessage.style.top = '10px';
        statusMessage.style.left = '10px';
        statusMessage.style.backgroundColor = '#4CAF50';
        statusMessage.style.padding = '10px';
        statusMessage.style.borderRadius = '5px';
        statusMessage.style.transition = 'opacity 1s ease-in-out';

        document.body.appendChild(statusMessage);

        setTimeout(() => {
            statusMessage.style.opacity = '0';
            setTimeout(() => {
                document.body.removeChild(statusMessage);
            }, 1000);
        }, 1500);
    });

    // 表情包状态的初始化
    let iconSetStatus = GM_getValue('iconSetStatus') || {};
    console.log('Initial iconSetStatus:', iconSetStatus);

    //添加表情
    const loadIcons = (loaded) => {
        if (loaded) return;

        const { correctAttachUrl } = ui;
        const tabs = poster.selectSmilesw._.__c.firstElementChild;
        const contents = poster.selectSmilesw._.__c.lastElementChild;

        const iconSets = JSON.parse(GM_getValue('cachedIconSets'));

        iconSets.forEach(group => {
            const groupName = group.name;
            const author = group.author;
            const tab = document.createElement('BUTTON');
            const content = document.createElement('DIV');

            tab.className = 'block_txt_big';
            tab.innerText = groupName;
            const isIconSetStatus = iconSetStatus[groupName];
            if (isIconSetStatus) {
                tab.onclick = () => {
                    tabs.firstChild.textContent = author; // 统一作者名称

                    contents.childNodes.forEach((c) => {
                        c.style.display = c !== content ? 'none' : '';
                    });

                    if (content.childNodes.length === 0) {
                        const sliderContainer = document.createElement('DIV');
                        sliderContainer.style.display = 'flex';
                        sliderContainer.style.flexDirection = 'column';
                        sliderContainer.style.overflowX = 'auto';
                        sliderContainer.style.whiteSpace = 'nowrap';

                        const rows = 3; // 限制显示三行表情
                        const iconsPerRow = Math.ceil(group.data.length / rows);

                        for (let i = 0; i < rows; i++) {
                            const rowContainer = document.createElement('DIV');
                            rowContainer.style.display = 'flex';
                            rowContainer.style.flexDirection = 'row';

                            for (let j = 0; j < iconsPerRow; j++) {
                                const index = i * iconsPerRow + j;
                                if (index < group.data.length) {
                                    const icon = group.data[index];
                                    const iconElement = document.createElement('IMG');
                                    iconElement.src = correctAttachUrl(icon.img);
                                    iconElement.style.maxHeight = '100px';
                                    iconElement.style.margin = '0 5px';
                                    iconElement.title = icon.name;
                                    iconElement.onclick = () => {
                                        poster.selectSmilesw._.hide();
                                        poster.addText(`[img]${icon.img}[/img]`);
                                    };

                                    rowContainer.appendChild(iconElement);
                                }
                            }

                            sliderContainer.appendChild(rowContainer);
                        }

                        content.appendChild(sliderContainer);
                    }
                };

                tabs.appendChild(tab);
                contents.appendChild(content);
            }
        });
    };

    hookFunction(poster, 'selectSmiles', (returnValue) => loadIcons(returnValue));
})(commonui, postfunc);