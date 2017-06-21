

Define("Timer", null, function (delay_, onTick_, onStart_, onStop_) {

    //#region Members

    var _self = this;
    var m_id = null;
    var m_delay = 0;
    var m_onTick = null;
    var m_onStart = null;
    var m_onStop = null;
    var m_enabled = false;

    //#endregion

    //#region Public Methods

    this.Constructor = function (delay_, onTick_, onStart_, onStop_) {

        m_delay = delay_;
        m_onTick = onTick_;
        m_onStart = onStart_;
        m_onStop = onStop_;

        //Application.On("ThreadCreated", _self.Stop);
        //Application.On("ThreadFinished", _self.Start);
    };

    this.Start = function (update_) {
        update_ = Default(update_, false);
        if (update_)
            m_enabled = true;
        if (!m_enabled) return;
        m_id = setInterval(function () {
            if (m_onTick) m_onTick();
        }, delay_);
        if (m_onStart) m_onStart();
    };

    this.Stop = function (update_) {
        update_ = Default(update_, false);
        if (update_)
            m_enabled = false;
        if (m_id != null)
            clearInterval(m_id);
        m_id = null;
        if (m_onStop) m_onStop();
    };

    this.Delay = function (value) {

        m_delay = value;

        if (m_id != null) {
            clearInterval(m_id);           
            m_id = setInterval(function () {
                if (m_onTick) m_onTick();
            }, m_delay);
        }
    };

    this.ClearEvents = function () {
        m_onStart = null;
        m_onStop = null;
        m_onTick = null;
    };

    //#endregion    

    return this.Constructor(delay_, onTick_, onStart_, onStop_);

});