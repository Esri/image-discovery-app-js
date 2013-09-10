define([
    "dojo/_base/declare",
    "dojo/_base/lang",
    "dojo/topic",
    "dojo/_base/array"
],
    function (declare, lang, topic, array) {
        return declare(
            [],
            {
                lockWidgetArray: [],
                constructor: function () {
                    this._initListeners()
                },
                _initListeners: function () {
                    topic.subscribe(IMAGERY_GLOBALS.EVENTS.QUERY.FILTER.ADD_USER_LOCK, lang.hitch(this, this.addLock));
                    topic.subscribe(IMAGERY_GLOBALS.EVENTS.QUERY.FILTER.REMOVE_USER_LOCK, lang.hitch(this, this.removeLock));
                },
                /**
                 * adds lock to filter widget. disables the user from applying filter functions
                 * @param lockWidget
                 */
                addLock: function (lockWidget) {
                    if (array.indexOf(this.lockWidgetArray, lockWidget) < 0) {
                        this.lockWidgetArray.push(lockWidget);
                        if (this.lockWidgetArray.length == 1) {
                            topic.publish(IMAGERY_GLOBALS.EVENTS.QUERY.FILTER.USER_DISABLE);
                        }
                    }
                },
                /**
                 * removes lock to filter widget. allows the user to apply filter functions if there are no locks
                 * @param lockWidget
                 */
                removeLock: function (lockWidget) {
                    var idx = array.indexOf(this.lockWidgetArray, lockWidget);
                    if (idx > -1) {
                        this.lockWidgetArray.splice(idx, 1);
                        if (this.lockWidgetArray.length == 0) {
                            topic.publish(IMAGERY_GLOBALS.EVENTS.QUERY.FILTER.USER_ENABLE);
                        }
                    }
                }
            });
    });