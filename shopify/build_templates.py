"""Generate the Lantern shop templates (homepage, collection, search, product).

Run:  python3 shopify/build_templates.py
Writes shopify/theme/templates/*.json. Settings left out of a block fall back
to the theme's defaults, so only the settings we care about are listed.
"""
import json
from pathlib import Path

OUT = Path(__file__).parent / "theme" / "templates"

AGE_SHELVES = [
    ("board-books-ages-0-3", "Board Books", "Ages 0-3"),
    ("picture-books-ages-3-7", "Picture Books", "Ages 3-7"),
    ("early-readers-chapter-books-ages-5-8", "Early Readers", "Ages 5-8"),
    ("middle-grade-ages-8-12", "Middle Grade", "Ages 8-12"),
    ("young-adult-ages-12", "Young Adult", "Ages 12+"),
    ("for-grown-ups", "For Grown-Ups", "Adults"),
]


def book_row(collection, heading, subheading="", limit=8):
    return {
        "type": "lantern-book-row",
        "settings": {
            "collection": collection,
            "heading": heading,
            "subheading": subheading,
            "link_label": "See all",
            "limit": limit,
        },
    }


def homepage():
    shelves = {
        "type": "lantern-shelves",
        "blocks": {
            f"shelf_{i}": {
                "type": "shelf",
                "settings": {"collection": handle, "label": label, "ages": ages},
            }
            for i, (handle, label, ages) in enumerate(AGE_SHELVES)
        },
        "block_order": [f"shelf_{i}" for i in range(len(AGE_SHELVES))],
        "settings": {
            "show_search": True,
            "placeholder": "Search by title, author or topic",
            "heading": "Shop by age",
        },
    }
    sections = {
        "shelves": shelves,
        "row_emily": book_row("emilys-recommendations", "Emily's Picks",
                              "Hand-picked from our shelves"),
        "row_season": book_row("halloween-collection", "Halloween Reads"),
        "row_picture": book_row("picture-books-ages-3-7", "Picture Books"),
        "row_middle": book_row("middle-grade-ages-8-12", "Middle Grade"),
        "special_order": {"type": "lantern-special-order", "settings": {}},
        "row_gifts": book_row("gifts-goodies", "Gifts & Goodies"),
    }
    return {"sections": sections, "order": list(sections)}


def card_blocks(image_ratio="portrait"):
    """Product card: 2:3 cover (via lantern.css), title/author, price, pickup."""
    return {
        "card-gallery": {
            "type": "_product-card-gallery",
            "settings": {"image_ratio": image_ratio},
            "blocks": {},
        },
        "group": {
            "type": "_product-card-group",
            "settings": {
                "horizontal_alignment_flex_direction_column": "flex-start",
                "gap": 4,
            },
            "blocks": {
                "book_text": {
                    "type": "lantern-card-text",
                    "settings": {"content": "title_author"},
                },
                "price": {
                    "type": "price",
                    "settings": {
                        "show_sale_price_first": True,
                        "show_installments": False,
                        "show_tax_info": False,
                        "type_preset": "paragraph",
                        "alignment": "left",
                    },
                },
                "pickup": {
                    "type": "lantern-card-text",
                    "settings": {"content": "pickup"},
                },
            },
            "block_order": ["book_text", "price", "pickup"],
        },
    }


def filters_block():
    return {
        "type": "filters",
        "static": True,
        "settings": {
            "enable_filtering": True,
            "filter_style": "vertical",
            "text_label_case": "none",
            "enable_sorting": True,
            "enable_grid_density": False,
        },
    }


def product_card():
    return {
        "type": "_product-card",
        "static": True,
        "settings": {"product_card_gap": 10},
        "blocks": card_blocks(),
        "block_order": ["card-gallery", "group"],
    }


def grid_settings(padding_top):
    return {
        "layout_type": "grid",
        "product_card_size": "small",
        "mobile_product_card_size": "small",
        "product_grid_width": "centered",
        "full_width_on_mobile": False,
        "columns_gap_horizontal": 20,
        "columns_gap_vertical": 32,
        "color_scheme": "scheme-1",
        "padding-block-start": padding_top,
        "padding-block-end": 48,
    }


def collection():
    heading = {
        "type": "section",
        "name": "Collection heading",
        "blocks": {
            "title": {
                "type": "text",
                "name": "Title",
                "settings": {
                    "text": "<h1>{{ closest.collection.title }}</h1>",
                    "type_preset": "h2",
                    "alignment": "left",
                },
            },
        },
        "block_order": ["title"],
        "settings": {
            "section_width": "page-width",
            "horizontal_alignment_flex_direction_column": "flex-start",
            "color_scheme": "scheme-1",
            "padding-block-start": 32,
            "padding-block-end": 8,
        },
    }
    main = {
        "type": "main-collection",
        "blocks": {"filters": filters_block(), "product-card": product_card()},
        "settings": grid_settings(0),
    }
    return {
        "sections": {
            "section": heading,
            "topics": {"type": "lantern-topic-links", "settings": {"prefix": "Topic:"}},
            "main": main,
        },
        "order": ["section", "topics", "main"],
    }


def search():
    return {
        "sections": {
            "search": {
                "type": "search-header",
                "blocks": {
                    "heading": {"type": "_heading", "static": True, "settings": {"type_preset": "h2"}},
                    "search": {
                        "type": "_search-input",
                        "static": True,
                        "settings": {"width": "custom", "custom_width": 60},
                    },
                },
                "settings": {
                    "alignment": "flex-start",
                    "color_scheme": "scheme-1",
                    "padding-block-start": 32,
                    "padding-block-end": 0,
                },
            },
            "main": {
                "type": "search-results",
                "blocks": {"filters": filters_block(), "product-card": product_card()},
                "settings": grid_settings(24),
            },
            "special_order": {
                "type": "lantern-special-order",
                "settings": {
                    "only_without_results": True,
                    "heading": "We can probably get it.",
                },
            },
        },
        "order": ["search", "special_order", "main"],
    }


def text_block(html, preset="rte", name=None):
    block = {"type": "text", "settings": {"text": html, "type_preset": preset, "width": "100%"}}
    if name:
        block["name"] = name
    return block


def product():
    """Product page: whole cover (no crop), pickup line, shelf links below.

    Drops Vessel's demo content ("Care & Maintenance", "Embracing small
    joys", stock shipping copy) and swaps "You may also like" for
    "More from this shelf".
    """
    details = {
        "type": "group",
        "name": "Details",
        "settings": {
            "content_direction": "column",
            "horizontal_alignment_flex_direction_column": "flex-start",
            "gap": 24,
            "width": "fill",
            "padding-block-start": 40,
        },
        "blocks": {
            "title": text_block("<h1>{{ closest.product.title }}</h1>", "h3", "Title"),
            "price": {
                "type": "price",
                "settings": {
                    "show_sale_price_first": True,
                    "show_installments": False,
                    "show_tax_info": False,
                    "type_preset": "h5",
                    "alignment": "left",
                },
            },
            "description": {
                "type": "product-description",
                "settings": {"text": "<p>{{ closest.product.description }}</p>"},
            },
            "variant_picker": {
                "type": "variant-picker",
                "settings": {"variant_style": "buttons", "show_swatches": True, "alignment": "left"},
            },
            "buy_buttons": {
                "type": "buy-buttons",
                "settings": {"stacking": False, "show_pickup_availability": True, "gift_card_form": True},
                "blocks": {
                    "quantity": {"type": "quantity", "static": True, "settings": {}},
                    "add-to-cart": {"type": "add-to-cart", "static": True, "settings": {"style_class": "button"}},
                    "accelerated-checkout": {"type": "accelerated-checkout", "static": True, "settings": {}},
                },
                "block_order": [],
            },
            "pickup_info": {
                "type": "accordion",
                "settings": {"icon": "plus", "dividers": True, "type_preset": "h5"},
                "blocks": {
                    "pickup_row": {
                        "type": "_accordion-row",
                        "settings": {"heading": "Pickup & special orders", "open_by_default": False},
                        "blocks": {
                            "pickup_text": text_block(
                                "<p>Order online and pick up at 15729 Madison Ave, Tuesday to "
                                "Saturday, 10am to 6pm. We'll email you when it's ready, "
                                "usually within 24 hours.</p>"
                                "<p>Looking for something we don't have? Call "
                                "(216) 999-4462 and we'll order it for you.</p>"
                            ),
                        },
                        "block_order": ["pickup_text"],
                    },
                },
                "block_order": ["pickup_row"],
            },
        },
        "block_order": ["title", "price", "description", "variant_picker", "buy_buttons", "pickup_info"],
    }
    main = {
        "type": "product-information",
        "blocks": {
            "media-gallery": {
                "type": "_product-media-gallery",
                "static": True,
                "settings": {
                    "media_presentation": "carousel",
                    "slideshow_controls_style": "thumbnails",
                    "slideshow_mobile_controls_style": "dots",
                    "aspect_ratio": "adapt",
                    "constrain_to_viewport": True,
                    "media_fit": "contain",
                    "zoom": True,
                },
            },
            "product-details": {
                "type": "_product-details",
                "static": True,
                "settings": {"width": "fill", "gap": 20, "sticky_details_desktop": True, "padding-block-end": 32},
                "blocks": {"details": details},
                "block_order": ["details"],
            },
        },
        "settings": {
            "content_width": "content-center-aligned",
            "desktop_media_position": "left",
            "equal_columns": True,
            "limit_details_width": True,
            "gap": 48,
            "enable_sticky_add_to_cart": True,
            "color_scheme": "scheme-1",
            "padding-block-start": 0,
            "padding-block-end": 0,
        },
    }
    return {
        "sections": {
            "main": main,
            "shelf": {"type": "lantern-product-shelf", "settings": {}},
        },
        "order": ["main", "shelf"],
    }


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    for name, data in {
        "index": homepage(),
        "collection": collection(),
        "search": search(),
        "product": product(),
    }.items():
        (OUT / f"{name}.json").write_text(json.dumps(data, indent=2) + "\n")
        print("wrote", OUT / f"{name}.json")


if __name__ == "__main__":
    main()
