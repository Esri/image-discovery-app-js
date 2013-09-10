define([
    "dojo/_base/declare",
    "dojo/_base/lang",
    "dojo/has",
    "dojo/topic"
],
    function (declare, lang, has, topic) {
        return declare(
            [],
            {
                localStoragePersistSupported: true,
                constructor: function () {
                    if (!(has("ie") < 8)) {
                        this.localStoragePersistSupported = false;
                    }
                    this.storageProvider = dojox.storage.manager.getProvider();

                    if (this.storageProvider) {
                        this.localStoragePersistSupported = true;
                    }
                    this.persistedUserCatalogs = this.loadPersistedUserCatalogs();
                },
                deleteUserPersistedCatalog: function (catalog) {
                    for (var i = 0; i < this.persistedUserCatalogs.length; i++) {
                        if (this.persistedUserCatalogs[i].id == catalog.id) {
                            this.persistedUserCatalogs.splice(i, 1);
                            this.persist();
                            break;
                        }
                    }
                    return this.persistedUserCatalogs.length > 0;
                },
                persistUserCatalog: function (catalog) {
                    if (catalog == null || !lang.isObject(catalog)) {
                        return null;
                    }
                    this.persistedUserCatalogs.push({id: VIEWER_UTILS.generateUUID(), catalog: catalog});
                    this.persist();
                    VIEWER_UTILS.log("Saved catalog", VIEWER_GLOBALS.LOG_TYPE.INFO);
                    topic.publish(VIEWER_GLOBALS.EVENTS.MESSAGING.SHOW, "Catalog Saved");
                    return catalog;
                },
                loadPersistedUserCatalogs: function () {
                    if (this.storageProvider) {
                        if (this.storageProvider.hasKey(IMAGERY_GLOBALS.STORAGE.LABELS.CATALOGS)) {
                            return this.storageProvider.get(IMAGERY_GLOBALS.STORAGE.LABELS.CATALOGS);
                        }
                    }
                    return [];
                },
                persist: function () {
                    this.storageProvider.put(IMAGERY_GLOBALS.STORAGE.LABELS.CATALOGS, this.persistedUserCatalogs);
                }
            });
    });