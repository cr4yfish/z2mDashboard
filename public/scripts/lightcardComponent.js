Vue.component("lightcard-component", {
    props: ['friendlyname', 'title'],
    data() {

        return {

        }
    },
    template: `<div :id=friendlyname class="card light-card">
                    <div :id=friendlyname class="lightSlider">
                        <div class="card-body">
                            <label class="" >{{ title }}</label>
                        </div>
                    </div>
                </div>`
})

var lights = new Vue({
    el: "#lightSwitches"

})
