define([
    "dojo/_base/declare",
    "esriviewer/ui/time/model/TimeSliderWidgetViewModel"
],
    function (declare, TimeSliderWidgetViewModel) {
        return declare(
            [TimeSliderWidgetViewModel],
            {
                showRangeContainer: false,
                showIntervalSelect: false,
                noRasterDisabledMessage: "There are no results on the map",
                unsupportedRastersMessage: "There must be at least two images on the map.",
                notEnoughUniqueValues: "There must be at least two unique dates for time slider."
            });

    })
;