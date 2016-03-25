angular.module('ionic-datetimepicker.provider', [])

    .provider('ionicDateTimePicker', function () {

        var config = {
            setLabel: 'Set',
            todayLabel: 'Today',
            closeLabel: 'Close',
            inputDate: new Date(),
            mondayFirst: true,
            weeksList: ["S", "M", "T", "W", "T", "F", "S"],
            monthsList: ["Jan", "Feb", "March", "April", "May", "June", "July", "Aug", "Sept", "Oct", "Nov", "Dec"],
            timeStatus: [],
            templateType: 'popup',
            showTodayButton: false,
            closeOnSelect: false,
            enableTimes: false,
            showToday: false,
            disableWeekdays: []
        };

        this.configDatePicker = function (inputObj) {
            angular.extend(config, inputObj);
        };

        this.$get = ['$rootScope', '$ionicPopup', '$ionicModal', 'IonicDateTimepickerService', '$filter',
            function ($rootScope, $ionicPopup, $ionicModal, IonicDatepickerService, $filter) {

                var provider = {};

                var $scope = $rootScope.$new();
                $scope.today = resetHMSM(new Date()).getTime();
                $scope.disabledDates = [];

                //Reset the hours, minutes, seconds and milli seconds
                function resetHMSM(currentDate) {
                    currentDate.setHours(0);
                    currentDate.setMinutes(0);
                    currentDate.setSeconds(0);
                    currentDate.setMilliseconds(0);
                    return currentDate;
                }

                //Previous month
                $scope.prevMonth = function () {
                    if ($scope.currentDate.getMonth() === 1) {
                        $scope.currentDate.setFullYear($scope.currentDate.getFullYear());
                    }
                    $scope.currentDate.setMonth($scope.currentDate.getMonth() - 1);
                    $scope.currentMonth = $scope.mainObj.monthsList[$scope.currentDate.getMonth()];
                    $scope.currentYear = $scope.currentDate.getFullYear();
                    refreshDateList($scope.currentDate);
                };

                //Next month
                $scope.nextMonth = function () {
                    if ($scope.currentDate.getMonth() === 11) {
                        $scope.currentDate.setFullYear($scope.currentDate.getFullYear());
                    }
                    $scope.currentDate.setDate(1);
                    $scope.currentDate.setMonth($scope.currentDate.getMonth() + 1);
                    $scope.currentMonth = $scope.mainObj.monthsList[$scope.currentDate.getMonth()];
                    $scope.currentYear = $scope.currentDate.getFullYear();
                    refreshDateList($scope.currentDate);
                };

                //Date selected
                $scope.dateSelected = function (selectedDate) {
                    if (!selectedDate || Object.keys(selectedDate).length === 0) return;
                    $scope.selctedDateEpoch = selectedDate.epoch;

                    $scope.currentTimeStatus = getCurrentTimeStatus();

                    if ($scope.mainObj.closeOnSelect) {
                        $scope.mainObj.callback($scope.selctedDateEpoch);
                        if ($scope.mainObj.templateType.toLowerCase() == 'popup') {
                            $scope.popup.close();
                        } else {
                            closeModal();
                        }
                    }
                };

                //Time selected
                $scope.timeSelected = function (index) {
                    $scope.timeSelectedIndex = index;
                };

                function getCurrentTimeStatus() {
                    var result = {
                        status: [false, false], // morning && afternoon
                        dateString: ""
                    };
                    if ($scope.timeStatus) {
                        var dateString = $filter('date')($scope.selctedDateEpoch, 'yyyy-MM-dd');
                        for (var key in $scope.timeStatus) {
                            var item = $scope.timeStatus[key];
                            if (item.dateString == dateString) {
                                return item;
                            }
                        }
                    }
                    return result;
                }

                function appendTimeToResult() {
                    if ($scope.enableTimes && $scope.timeSelectedIndex >= 0) {
                        var date = new Date($scope.selctedDateEpoch);
                        var hour = $scope.timeSelectedIndex == 0 ? 8 : 14;
                        date.setHours(hour);
                        $scope.selctedDateEpoch = date.getTime();
                    }
                }

                //Set today as date for the modal
                $scope.setIonicDatePickerTodayDate = function () {
                    var today = new Date();
                    refreshDateList(new Date());
                    $scope.selctedDateEpoch = resetHMSM(today).getTime();
                    if ($scope.mainObj.closeOnSelect) {
                        appendTimeToResult();
                        $scope.mainObj.callback($scope.selctedDateEpoch);
                        closeModal();
                    }
                };

                //Set date for the modal
                $scope.setIonicDatePickerDate = function () {
                    appendTimeToResult();
                    $scope.mainObj.callback($scope.selctedDateEpoch);
                    closeModal();
                };

                //Setting the disabled dates list.
                function setDisabledDates(mainObj) {
                    if (!mainObj.disabledDates || mainObj.disabledDates.length === 0) {
                        $scope.disabledDates = [];
                    } else {
                        angular.forEach(mainObj.disabledDates, function (val, key) {
                            val = resetHMSM(new Date(val));
                            $scope.disabledDates.push(val.getTime());
                        });
                    }
                }

                //Refresh the list of the dates of a month
                function refreshDateList(currentDate) {
                    currentDate = resetHMSM(currentDate);
                    $scope.currentDate = angular.copy(currentDate);

                    var firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDate();
                    var lastDay = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();

                    $scope.monthsList = [];
                    if ($scope.mainObj.monthsList && $scope.mainObj.monthsList.length === 12) {
                        $scope.monthsList = $scope.mainObj.monthsList;
                    } else {
                        $scope.monthsList = IonicDatepickerService.monthsList;
                    }

                    $scope.yearsList = IonicDatepickerService.getYearsList($scope.mainObj.from, $scope.mainObj.to);

                    $scope.dayList = [];

                    var tempDate, disabled;
                    $scope.firstDayEpoch = resetHMSM(new Date(currentDate.getFullYear(), currentDate.getMonth(), firstDay)).getTime();
                    $scope.lastDayEpoch = resetHMSM(new Date(currentDate.getFullYear(), currentDate.getMonth(), lastDay)).getTime();

                    for (var i = firstDay; i <= lastDay; i++) {
                        tempDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), i);
                        disabled = (tempDate.getTime() < $scope.fromDate) || (tempDate.getTime() > $scope.toDate) ||
                            $scope.mainObj.disableWeekdays.indexOf(tempDate.getDay()) >= 0;

                        $scope.dayList.push({
                            date: tempDate.getDate(),
                            month: tempDate.getMonth(),
                            year: tempDate.getFullYear(),
                            day: tempDate.getDay(),
                            epoch: tempDate.getTime(),
                            disabled: disabled
                        });
                    }

                    //To set Monday as the first day of the week.
                    var firstDayMonday = $scope.dayList[0].day - $scope.mainObj.mondayFirst;
                    firstDayMonday = (firstDayMonday < 0) ? 6 : firstDayMonday;

                    for (var j = 0; j < firstDayMonday; j++) {
                        $scope.dayList.unshift({});
                    }

                    $scope.rows = [0, 7, 14, 21, 28, 35];
                    $scope.cols = [0, 1, 2, 3, 4, 5, 6];

                    $scope.currentMonth = $scope.mainObj.monthsList[currentDate.getMonth()];
                    $scope.currentYear = currentDate.getFullYear();
                    $scope.currentMonthSelected = angular.copy($scope.currentMonth);
                    $scope.currentYearSelected = angular.copy($scope.currentYear);
                    $scope.numColumns = 7;
                }

                //Month changed
                $scope.monthChanged = function (month) {
                    var monthNumber = $scope.monthsList.indexOf(month);
                    $scope.currentDate.setMonth(monthNumber);
                    refreshDateList($scope.currentDate);
                };

                //Year changed
                $scope.yearChanged = function (year) {
                    $scope.currentDate.setFullYear(year);
                    refreshDateList($scope.currentDate);
                };

                //Setting up the initial object
                function setInitialObj(ipObj) {
                    $scope.mainObj = angular.copy(ipObj);
                    $scope.selctedDateEpoch = resetHMSM($scope.mainObj.inputDate).getTime();

                    if ($scope.mainObj.weeksList && $scope.mainObj.weeksList.length === 7) {
                        $scope.weeksList = $scope.mainObj.weeksList;
                    } else {
                        $scope.weeksList = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
                    }
                    if ($scope.mainObj.mondayFirst) {
                        $scope.weeksList.push($scope.mainObj.weeksList.shift());
                    }
                    $scope.timeStatus = $scope.mainObj.timeStatus ? $scope.mainObj.timeStatus : [];
                    $scope.currentTimeStatus = getCurrentTimeStatus();

                    $scope.disableWeekdays = $scope.mainObj.disableWeekdays;

                    $scope.enableTimes = $scope.mainObj.enableTimes;
                    $scope.showToday = $scope.mainObj.showToday;

                    refreshDateList($scope.mainObj.inputDate);
                    setDisabledDates($scope.mainObj);
                }

                $ionicModal.fromTemplateUrl('ionic-datetimepicker-modal.html', {
                    scope: $scope,
                    animation: 'slide-in-up'
                }).then(function (modal) {
                    $scope.modal = modal;
                });

                $scope.$on('$destroy', function () {
                    $scope.modal.remove();
                });

                function openModal() {
                    $scope.modal.show();
                }

                function closeModal() {
                    $scope.modal.hide();
                }

                $scope.closeIonicDatePickerModal = function () {
                    closeModal();
                };

                //Open datepicker popup
                provider.openDatePicker = function (ipObj) {
                    var buttons = [];
                    $scope.mainObj = angular.extend({}, config, ipObj);
                    if ($scope.mainObj.from) {
                        $scope.fromDate = resetHMSM(new Date($scope.mainObj.from)).getTime();
                        console.log($scope.fromDate);
                    }
                    if ($scope.mainObj.to) {
                        $scope.toDate = resetHMSM(new Date($scope.mainObj.to)).getTime();
                        console.log($scope.toDate);
                    }

                    if (ipObj.disableWeekdays && config.disableWeekdays) {
                        $scope.mainObj.disableWeekdays = ipObj.disableWeekdays.concat(config.disableWeekdays);
                    }
                    if (ipObj.enableTimes && config.enableTimes) {
                        $scope.mainObj.enableTimes = ipObj.enableTimes.concat(config.enableTimes);
                    }
                    if (ipObj.showToday && config.showToday) {
                        $scope.mainObj.showToday = ipObj.showToday.concat(config.showToday);
                    }

                    $scope.times = [
                        {title: "上午", range: "08:00-12:00"},
                        {title: "下午", range: "14:00-18:00"}
                    ];
                    $scope.timeSelectedIndex = -1;

                    setInitialObj($scope.mainObj);

                    if (!$scope.mainObj.closeOnSelect) {
                        buttons = [{
                            text: $scope.mainObj.setLabel,
                            type: 'button_set',
                            onTap: function (e) {
                                appendTimeToResult();
                                $scope.mainObj.callback($scope.selctedDateEpoch);
                            }
                        }];
                    }

                    if ($scope.mainObj.showTodayButton) {
                        buttons.push({
                            text: $scope.mainObj.todayLabel,
                            type: 'button_today',
                            onTap: function (e) {
                                var today = new Date();
                                refreshDateList(new Date());
                                $scope.selctedDateEpoch = resetHMSM(today).getTime();
                                if (!$scope.mainObj.closeOnSelect) {
                                    e.preventDefault();
                                }
                            }
                        });
                    }

                    buttons.push({
                        text: $scope.mainObj.closeLabel,
                        type: 'button_close',
                        onTap: function (e) {
                            console.log('ionic-datepicker popup closed.');
                        }
                    });

                    if ($scope.mainObj.templateType.toLowerCase() == 'popup') {
                        $scope.popup = $ionicPopup.show({
                            templateUrl: 'ionic-datetimepicker-popup.html',
                            scope: $scope,
                            cssClass: 'ionic_datepicker_popup',
                            buttons: buttons
                        });
                    } else {
                        openModal();
                    }
                };

                return provider;

            }];

    });