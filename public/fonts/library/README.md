# Editor font library

The 27 families the PDF editor can embed, plus the three fonts every PDF
viewer already has (Helvetica, Times Roman, Courier) which cost nothing.

## Where these files come from

Every family is the `latin` subset of the [Google Fonts](https://fonts.google.com)
release, taken from the [Fontsource](https://fontsource.org) npm package
`@fontsource/<family>` version 5.3.0. Nothing is scraped from a random CDN and
nothing is generated or renamed.

Each family folder holds:

* `<style>.ttf` — the file the PDF exporter embeds (subset further, so a line of
  text adds a few kilobytes, not the whole font);
* `<style>.woff2` — the same design for the on-screen preview, ~15 KB, loaded
  only when the editor actually shows that family.

Both were trimmed to Latin-1 plus the typographic characters a document uses
(en/em dash, curly quotes, bullet, ellipsis, euro, trademark). Text outside that
range falls back to the bundled DejaVu Sans and the editor says so before the
download finishes.

## Licence

All 27 families are licensed under the **SIL Open Font License 1.1**
(`OFL.txt` in this folder). The OFL allows free use, embedding in documents and
redistribution, including subsetting, as long as the copyright notice travels
with the font — which is why the attribution column below is kept.

| Family | Category | Files | Copyright |
| --- | --- | --- | --- |
| Inter | Sans serif | bold.ttf, bold.woff2, boldItalic.ttf, boldItalic.woff2, italic.ttf, italic.woff2, regular.ttf, regular.woff2 | Copyright 2016 The Inter Project Authors (https://github.com/rsms/inter) Inter-Italic[opsz,wght].ttf: Copyright 2016 The Inter Project Authors (https://github.com/rsms/inter) |
| Poppins | Sans serif | bold.ttf, bold.woff2, boldItalic.ttf, boldItalic.woff2, italic.ttf, italic.woff2, regular.ttf, regular.woff2 | Copyright 2020 The Poppins Project Authors (https://github.com/itfoundry/Poppins) Poppins-ThinItalic.ttf: Copyright 2020 The Poppins Project Authors (https://github.com/itfoundry/Poppins) Poppins-ExtraLight.ttf: Copyright 2020 The Poppins Project Authors (https://github.com/itfoundry/Poppins) Poppins-ExtraLightItalic.ttf: Copyright 2020 The Poppins Project Authors (https://github.com/itfoundry/Poppins) Poppins-Light.ttf: Copyright 2020 The Poppins Project Authors (https://github.com/itfoundry/Poppins) Poppins-LightItalic.ttf: Copyright 2020 The Poppins Project Authors (https://github.com/itfoundry/Poppins) Poppins-Regular.ttf: Copyright 2020 The Poppins Project Authors (https://github.com/itfoundry/Poppins) Poppins-Italic.ttf: Copyright 2020 The Poppins Project Authors (https://github.com/itfoundry/Poppins) Poppins-Medium.ttf: Copyright 2020 The Poppins Project Authors (https://github.com/itfoundry/Poppins) Poppins-MediumItalic.ttf: Copyright 2020 The Poppins Project Authors (https://github.com/itfoundry/Poppins) Poppins-SemiBold.ttf: Copyright 2020 The Poppins Project Authors (https://github.com/itfoundry/Poppins) Poppins-SemiBoldItalic.ttf: Copyright 2020 The Poppins Project Authors (https://github.com/itfoundry/Poppins) Poppins-Bold.ttf: Copyright 2020 The Poppins Project Authors (https://github.com/itfoundry/Poppins) Poppins-BoldItalic.ttf: Copyright 2020 The Poppins Project Authors (https://github.com/itfoundry/Poppins) Poppins-ExtraBold.ttf: Copyright 2020 The Poppins Project Authors (https://github.com/itfoundry/Poppins) Poppins-ExtraBoldItalic.ttf: Copyright 2020 The Poppins Project Authors (https://github.com/itfoundry/Poppins) Poppins-Black.ttf: Copyright 2020 The Poppins Project Authors (https://github.com/itfoundry/Poppins) Poppins-BlackItalic.ttf: Copyright 2020 The Poppins Project Authors (https://github.com/itfoundry/Poppins) |
| Montserrat | Sans serif | bold.ttf, bold.woff2, boldItalic.ttf, boldItalic.woff2, italic.ttf, italic.woff2, regular.ttf, regular.woff2 | Copyright 2011 The Montserrat Project Authors (https://github.com/JulietaUla/Montserrat) Montserrat-Italic[wght].ttf: Copyright 2011 The Montserrat Project Authors (https://github.com/JulietaUla/Montserrat) |
| Lato | Sans serif | bold.ttf, bold.woff2, boldItalic.ttf, boldItalic.woff2, italic.ttf, italic.woff2, regular.ttf, regular.woff2 | Copyright (c) 2010-2011 by tyPoland Lukasz Dziedzic (team@latofonts.com) with Reserved Font Name "Lato". Licensed under the SIL Open Font License, Version 1.1. Lato-HairlineItalic.ttf: Copyright (c) 2010-2011 by tyPoland Lukasz Dziedzic (team@latofonts.com) with Reserved Font Name "Lato". Licensed under the SIL Open Font License, Version 1.1. Lato-Light.ttf: Copyright (c) 2010-2011 by tyPoland Lukasz Dziedzic (team@latofonts.com) with Reserved Font Name "Lato". Licensed under the SIL Open Font License, Version 1.1. Lato-LightItalic.ttf: Copyright (c) 2010-2011 by tyPoland Lukasz Dziedzic (team@latofonts.com) with Reserved Font Name "Lato". Licensed under the SIL Open Font License, Version 1.1. Lato-Regular.ttf: Copyright (c) 2010-2011 by tyPoland Lukasz Dziedzic (team@latofonts.com) with Reserved Font Name "Lato". Licensed under the SIL Open Font License, Version 1.1. Lato-Italic.ttf: Copyright (c) 2010-2011 by tyPoland Lukasz Dziedzic (team@latofonts.com) with Reserved Font Name "Lato". Licensed under the SIL Open Font License, Version 1.1. Lato-Bold.ttf: Copyright (c) 2010-2011 by tyPoland Lukasz Dziedzic (team@latofonts.com) with Reserved Font Name "Lato". Licensed under the SIL Open Font License, Version 1.1. Lato-BoldItalic.ttf: Copyright (c) 2010-2011 by tyPoland Lukasz Dziedzic (team@latofonts.com) with Reserved Font Name "Lato". Licensed under the SIL Open Font License, Version 1.1. Lato-Black.ttf: Copyright (c) 2010-2011 by tyPoland Lukasz Dziedzic (team@latofonts.com) with Reserved Font Name "Lato". Licensed under the SIL Open Font License, Version 1.1. Lato-BlackItalic.ttf: Copyright (c) 2010-2011 by tyPoland Lukasz Dziedzic (team@latofonts.com) with Reserved Font Name "Lato". Licensed under the SIL Open Font License, Version 1.1. |
| Nunito | Sans serif | bold.ttf, bold.woff2, boldItalic.ttf, boldItalic.woff2, italic.ttf, italic.woff2, regular.ttf, regular.woff2 | Copyright 2014 The Nunito Project Authors (https://github.com/googlefonts/nunito) Nunito-Italic[wght].ttf: Copyright 2014 The Nunito Project Authors (https://github.com/googlefonts/nunito) |
| Playfair Display | Serif | bold.ttf, bold.woff2, boldItalic.ttf, boldItalic.woff2, italic.ttf, italic.woff2, regular.ttf, regular.woff2 | Copyright 2017 The Playfair Display Project Authors (https://github.com/clauseggers/Playfair-Display), with Reserved Font Name "Playfair Display". PlayfairDisplay-Italic[wght].ttf: Copyright 2017 The Playfair Display Project Authors (https://github.com/clauseggers/Playfair-Display), with Reserved Font Name "Playfair Display". |
| Merriweather | Serif | bold.ttf, bold.woff2, boldItalic.ttf, boldItalic.woff2, italic.ttf, italic.woff2, regular.ttf, regular.woff2 | Copyright 2024 The Merriweather Project Authors (https://github.com/EbenSorkin/Merriweather4) with Reserved Font Name "Merriweather". Merriweather-Italic[opsz,wdth,wght].ttf: Copyright 2024 The Merriweather Project Authors (https://github.com/EbenSorkin/Merriweather4) with Reserved Font Name "Merriweather". |
| Lora | Serif | bold.ttf, bold.woff2, boldItalic.ttf, boldItalic.woff2, italic.ttf, italic.woff2, regular.ttf, regular.woff2 | Copyright 2011 The Lora Project Authors (https://github.com/cyrealtype/Lora-Cyrillic), with Reserved Font Name "Lora". Lora-Italic[wght].ttf: Copyright 2011 The Lora Project Authors (https://github.com/cyrealtype/Lora-Cyrillic), with Reserved Font Name "Lora". |
| EB Garamond | Serif | bold.ttf, bold.woff2, boldItalic.ttf, boldItalic.woff2, italic.ttf, italic.woff2, regular.ttf, regular.woff2 | Copyright 2017 The EB Garamond Project Authors (https://github.com/octaviopardo/EBGaramond12) EBGaramond-Italic[wght].ttf: Copyright 2017 The EB Garamond Project Authors (https://github.com/octaviopardo/EBGaramond12) |
| Cormorant Garamond | Serif | bold.ttf, bold.woff2, boldItalic.ttf, boldItalic.woff2, italic.ttf, italic.woff2, regular.ttf, regular.woff2 | Copyright 2015 The Cormorant Project Authors (github.com/CatharsisFonts/Cormorant) CormorantGaramond-Italic[wght].ttf: Copyright 2015 The Cormorant Project Authors (github.com/CatharsisFonts/Cormorant) |
| Roboto Slab | Slab serif | bold.ttf, bold.woff2, regular.ttf, regular.woff2 | Copyright 2018 The Roboto Slab Project Authors (https://github.com/googlefonts/robotoslab) |
| Bitter | Slab serif | bold.ttf, bold.woff2, boldItalic.ttf, boldItalic.woff2, italic.ttf, italic.woff2, regular.ttf, regular.woff2 | Copyright 2011 The Bitter Project Authors (https://github.com/solmatas/BitterPro) Bitter-Italic[wght].ttf: Copyright 2011 The Bitter Project Authors (https://github.com/solmatas/BitterPro) |
| Great Vibes | Script | regular.ttf, regular.woff2 | Copyright 2010 The Great Vibes Pro Project Authors (https://github.com/googlefonts/great-vibes) |
| Dancing Script | Script | bold.ttf, bold.woff2, regular.ttf, regular.woff2 | Copyright 2016 The Dancing Script Project Authors (https://github.com/googlefonts/DancingScript), with Reserved Font Name 'Dancing Script'. |
| Sacramento | Script | regular.ttf, regular.woff2 | Copyright (c) 2012 by Brian J. Bonislawsky DBA Astigmatic (AOETI) (astigma@astigmatic.com), with Reserved Font Name 'Sacramento' |
| Parisienne | Script | regular.ttf, regular.woff2 | Copyright (c) 2012 by Brian J. Bonislawsky DBA Astigmatic (AOETI) (astigma@astigmatic.com), with Reserved Font Name "Parisienne" |
| Caveat | Handwriting | bold.ttf, bold.woff2, regular.ttf, regular.woff2 | Copyright 2014 The Caveat Project Authors (https://github.com/googlefonts/caveat) |
| Patrick Hand | Handwriting | regular.ttf, regular.woff2 | Copyright (c) 2010-2012 Patrick Wagesreiter (mail@patrickwagesreiter.at) |
| Indie Flower | Handwriting | regular.ttf, regular.woff2 | Copyright 2010 The Indie Flower Authors (kimberlygeswein.com) |
| Shadows Into Light | Handwriting | regular.ttf, regular.woff2 | Copyright (c) 2010, Kimberly Geswein (kimberlygeswein.com kimberlygeswein@gmail.com) |
| Bebas Neue | Display | regular.ttf, regular.woff2 | Copyright 2019 The Bebas Neue Project Authors (https://github.com/dharmatype/Bebas-Neue) |
| Anton | Display | regular.ttf, regular.woff2 | Copyright 2020 The Anton Project Authors (https://github.com/googlefonts/AntonFont.git) |
| Lobster | Display | regular.ttf, regular.woff2 | Copyright 2010 The Lobster Project Authors (https://github.com/impallari/The-Lobster-Font), with Reserved Font Name "Lobster". |
| Cinzel | Display | bold.ttf, bold.woff2, regular.ttf, regular.woff2 | Copyright 2020 The Cinzel Project Authors (https://github.com/NDISCOVER/Cinzel) |
| Oswald | Display | bold.ttf, bold.woff2, regular.ttf, regular.woff2 | Copyright 2016 The Oswald Project Authors (https://github.com/googlefonts/OswaldFont) |
| JetBrains Mono | Monospace | bold.ttf, bold.woff2, boldItalic.ttf, boldItalic.woff2, italic.ttf, italic.woff2, regular.ttf, regular.woff2 | Copyright 2020 The JetBrains Mono Project Authors (https://github.com/JetBrains/JetBrainsMono) JetBrainsMono-Italic[wght].ttf: Copyright 2020 The JetBrains Mono Project Authors (https://github.com/JetBrains/JetBrainsMono) |
| Space Mono | Monospace | bold.ttf, bold.woff2, boldItalic.ttf, boldItalic.woff2, italic.ttf, italic.woff2, regular.ttf, regular.woff2 | Copyright 2016 The Space Mono Project Authors (https://github.com/googlefonts/spacemono) SpaceMono-Italic.ttf: Copyright 2016 The Space Mono Project Authors (https://github.com/googlefonts/spacemono) SpaceMono-Bold.ttf: Copyright 2016 The Space Mono Project Authors (https://github.com/googlefonts/spacemono) SpaceMono-BoldItalic.ttf: Copyright 2016 The Space Mono Project Authors (https://github.com/googlefonts/spacemono) |
