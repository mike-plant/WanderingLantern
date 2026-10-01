"""Generate Shopify theme config (settings_data.json, header-group.json) for the
Lantern redesign of the Vessel theme.

The palette mirrors src/assets/css/variables.css on the website. Run:
    python3 shopify/build_settings.py
Outputs go to shopify/theme/config/ and shopify/theme/sections/.
"""
import copy
import json
from pathlib import Path

OUT = Path(__file__).parent / "theme"

WARM_BROWN = "#8b6f47"
DEEP_BROWN = "#5c4d3c"
AGED_GOLD = "#c9a961"
GOLD_TEXT = "#7d6a48"
CREAM = "#faf7f0"
PARCHMENT = "#f5eedc"
DARK_TEXT = "#3a2f27"
WHITE = "#ffffff"

MENU_SCHEME = "scheme-af8d7617-bf1a-4b4b-95b6-8ba82c75b920"
SUBTLE_SCHEME = "scheme-58084d4c-a86e-4d0a-855e-a0966e5043f7"


def scheme(bg, text, heading, link, link_hover, border,
           btn_bg, btn_text, btn_hover_bg, sec_text, sec_border, sec_hover_bg,
           input_bg, variant_bg, selected_bg, selected_text):
    return {"settings": {
        "background": bg,
        "foreground_heading": heading,
        "foreground": text,
        "primary": link,
        "primary_hover": link_hover,
        "border": border,
        "shadow": DARK_TEXT,
        "primary_button_background": btn_bg,
        "primary_button_text": btn_text,
        "primary_button_border": btn_bg,
        "primary_button_hover_background": btn_hover_bg,
        "primary_button_hover_text": btn_text,
        "primary_button_hover_border": btn_hover_bg,
        "secondary_button_background": "rgba(0,0,0,0)",
        "secondary_button_text": sec_text,
        "secondary_button_border": sec_border,
        "secondary_button_hover_background": sec_hover_bg,
        "secondary_button_hover_text": sec_text,
        "secondary_button_hover_border": sec_border,
        "input_background": input_bg,
        "input_text_color": text,
        "input_border_color": border,
        "input_hover_background": input_bg,
        "variant_background_color": variant_bg,
        "variant_text_color": text,
        "variant_border_color": border,
        "variant_hover_background_color": PARCHMENT,
        "variant_hover_text_color": text,
        "variant_hover_border_color": WARM_BROWN,
        "selected_variant_background_color": selected_bg,
        "selected_variant_text_color": selected_text,
        "selected_variant_border_color": selected_bg,
        "selected_variant_hover_background_color": DARK_TEXT,
        "selected_variant_hover_text_color": selected_text,
        "selected_variant_hover_border_color": DARK_TEXT,
    }}


# Light parchment pages — the website's body background.
parchment = scheme(
    bg=PARCHMENT, text=DARK_TEXT, heading=DEEP_BROWN, link=WARM_BROWN,
    link_hover=DEEP_BROWN, border="#8b6f4733",
    btn_bg=WARM_BROWN, btn_text=WHITE, btn_hover_bg=DEEP_BROWN,
    sec_text=DEEP_BROWN, sec_border=AGED_GOLD, sec_hover_bg=CREAM,
    input_bg=CREAM, variant_bg=CREAM, selected_bg=WARM_BROWN, selected_text=WHITE,
)
# Cream cards/panels — the website's card background.
cream = copy.deepcopy(parchment)
cream["settings"].update({
    "background": CREAM,
    "input_background": WHITE,
    "input_hover_background": WHITE,
    "variant_background_color": WHITE,
})
# Dark deep-brown band — the website's info bar / footer.
dark = scheme(
    bg=DEEP_BROWN, text=CREAM, heading=CREAM, link=AGED_GOLD,
    link_hover=CREAM, border="#c9a96166",
    btn_bg=AGED_GOLD, btn_text=DARK_TEXT, btn_hover_bg=CREAM,
    sec_text=CREAM, sec_border=AGED_GOLD, sec_hover_bg="#ffffff1a",
    input_bg="#ffffff14", variant_bg=CREAM, selected_bg=AGED_GOLD, selected_text=DARK_TEXT,
)
# Variant pickers sit on cream chips even in dark sections, so their text
# stays dark; the selected chip is gold with dark text in both states.
dark["settings"].update({
    "variant_text_color": DARK_TEXT,
    "variant_hover_text_color": DARK_TEXT,
    "selected_variant_hover_background_color": CREAM,
    "selected_variant_hover_border_color": CREAM,
})
# Gold accent — sale badges, highlights.
gold = scheme(
    bg=AGED_GOLD, text=DARK_TEXT, heading=DARK_TEXT, link=DARK_TEXT,
    link_hover=DEEP_BROWN, border="#3a2f2733",
    btn_bg=DEEP_BROWN, btn_text=CREAM, btn_hover_bg=DARK_TEXT,
    sec_text=DARK_TEXT, sec_border=DARK_TEXT, sec_hover_bg="#ffffff33",
    input_bg=CREAM, variant_bg=CREAM, selected_bg=DEEP_BROWN, selected_text=CREAM,
)
# Muted parchment — sold-out badges, quiet panels.
muted = copy.deepcopy(parchment)
muted["settings"].update({"background": "#ebe2cb", "foreground": GOLD_TEXT,
                          "foreground_heading": DEEP_BROWN})
# Transparent header over the homepage hero: cream text, gold hover.
transparent = scheme(
    bg="rgba(0,0,0,0)", text=CREAM, heading=CREAM, link=CREAM,
    link_hover=AGED_GOLD, border="rgba(0,0,0,0)",
    btn_bg=CREAM, btn_text=DARK_TEXT, btn_hover_bg=AGED_GOLD,
    sec_text=CREAM, sec_border=CREAM, sec_hover_bg="rgba(0,0,0,0)",
    input_bg=WHITE, variant_bg=CREAM, selected_bg=WARM_BROWN, selected_text=WHITE,
)
# Inputs and variant chips keep light backgrounds, so they need dark text.
transparent["settings"].update({
    "shadow": "rgba(0,0,0,0)",
    "input_text_color": DARK_TEXT,
    "variant_text_color": DARK_TEXT,
    "variant_hover_text_color": DARK_TEXT,
})
subtle = copy.deepcopy(cream)
subtle["settings"]["background"] = "#8b6f470d"

SCHEMES = {
    "scheme-1": parchment,
    "scheme-2": cream,
    "scheme-3": muted,
    "scheme-4": dark,
    "scheme-5": gold,
    "scheme-6": transparent,
    SUBTLE_SCHEME: subtle,
    MENU_SCHEME: copy.deepcopy(parchment),
}


def build_settings(original):
    data = copy.deepcopy(original)
    cur = data["current"]
    cur.update({
        # Same families as the website: Playfair Display + Libre Baskerville.
        "type_heading_font": "playfair_display_n6",
        "type_subheading_font": "playfair_display_n4",
        "type_body_font": "libre_baskerville_n4",
        "type_accent_font": "playfair_display_i4",
        "type_size_paragraph": "16",
        "type_size_h1": "72",
        "type_case_h5": "none",
        # Sentence-case product titles instead of all-caps.
        "card_title_case": "none",
        "badge_corner_radius": 4,
        "badge_text_transform": "uppercase",
        # Website buttons and inputs have a soft 4px radius.
        "button_border_radius_primary": 4,
        "button_border_radius_secondary": 4,
        "inputs_border_radius": 4,
        "variant_button_radius": 4,
        "variant_swatch_radius": 4,
        "popover_border_radius": 6,
        # Cart note doubles as the gift-wrap request (label in snippets/cart-note.liquid).
        "show_cart_note": True,
    })
    cur["color_schemes"] = SCHEMES
    return data


def build_header_group(original):
    data = copy.deepcopy(original)
    data["sections"] = {
        "lantern_info_bar": {"type": "lantern-info-bar", "settings": {}},
        **data["sections"],
        "lantern_search_bar": {"type": "lantern-search-bar", "settings": {}},
    }
    data["order"] = ["lantern_info_bar", "header_section", "lantern_search_bar"]
    menu = data["sections"]["header_section"]["blocks"]["header-menu"]["settings"]
    menu.update({
        "menu": "lantern-main-menu",
        "color_scheme": MENU_SCHEME,
        "type_font_primary_size": "1rem",
        "type_font_primary_link": "subheading",
        "type_case_primary_link": "none",
    })
    header = data["sections"]["header_section"]["settings"]
    header.update({
        "show_country": False,
        "show_language": False,
        "color_scheme_top": "scheme-1",
        "color_scheme_bottom": "scheme-1",
        # Solid parchment header like the website's nav; the transparent one
        # made the logo and icons unreadable over the hero illustration.
        "enable_transparent_header_home": False,
    })
    return data


def strip_comment(text):
    return text[text.index("{"):]


if __name__ == "__main__":
    src = Path(__file__).parent / "original"
    settings = json.loads(strip_comment((src / "settings_data.json").read_text()))
    header = json.loads(strip_comment((src / "header-group.json").read_text()))
    (OUT / "config").mkdir(parents=True, exist_ok=True)
    (OUT / "sections").mkdir(parents=True, exist_ok=True)
    (OUT / "config" / "settings_data.json").write_text(
        json.dumps(build_settings(settings), indent=2) + "\n")
    (OUT / "sections" / "header-group.json").write_text(
        json.dumps(build_header_group(header), indent=2) + "\n")
    print("wrote", OUT / "config" / "settings_data.json")
    print("wrote", OUT / "sections" / "header-group.json")
