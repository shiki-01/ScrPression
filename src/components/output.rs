use dioxus::prelude::*;

#[component]
pub fn Output() -> Element {
    rsx! (
        div {
            id: "output",
        }
    )
}