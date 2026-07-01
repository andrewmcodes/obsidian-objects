# Changelog

## [1.2.0](https://github.com/andrewmcodes/obsidian-objects/compare/1.1.0...1.2.0) (2026-07-01)


### Features

* **schema:** per-property defaults & datetime type ([#20](https://github.com/andrewmcodes/obsidian-objects/issues/20)) ([2521ba1](https://github.com/andrewmcodes/obsidian-objects/commit/2521ba14d6c0278d370b29ff0c8ebfc0340c8680))
* **schema:** schema variants ([#16](https://github.com/andrewmcodes/obsidian-objects/issues/16)) ([69cf97d](https://github.com/andrewmcodes/obsidian-objects/commit/69cf97d36670027484eff9025b69bfb530fce6b0))
* **settings:** configurable automatic properties ([#17](https://github.com/andrewmcodes/obsidian-objects/issues/17)) ([26e511d](https://github.com/andrewmcodes/obsidian-objects/commit/26e511d5291d8e32387773aae2a844a9411f0456))
* **templates:** date-format & property tokens ([#14](https://github.com/andrewmcodes/obsidian-objects/issues/14)) ([79703fb](https://github.com/andrewmcodes/obsidian-objects/commit/79703fb17451e3d990e80d245a5df6fac2ab350c))
* **templates:** generate template files for object types ([#18](https://github.com/andrewmcodes/obsidian-objects/issues/18)) ([#23](https://github.com/andrewmcodes/obsidian-objects/issues/23)) ([3de4e76](https://github.com/andrewmcodes/obsidian-objects/commit/3de4e762597cc487457dd47a15cef8ef9ddb9c52))
* **templates:** optional Templater pass-through ([#15](https://github.com/andrewmcodes/obsidian-objects/issues/15)) ([5bdba8b](https://github.com/andrewmcodes/obsidian-objects/commit/5bdba8b4eb6c6a6bae41bf332b98c1628ffa18dd))


### Bug Fixes

* **frontmatter:** write blank schema keys instead of dropping them ([#22](https://github.com/andrewmcodes/obsidian-objects/issues/22)) ([2e3c263](https://github.com/andrewmcodes/obsidian-objects/commit/2e3c2633271ae9cdf5baa301b9627f99b9b7f5c7)), closes [#11](https://github.com/andrewmcodes/obsidian-objects/issues/11)
* **schema:** import fidelity & optionless multiselect ([#12](https://github.com/andrewmcodes/obsidian-objects/issues/12)) ([3cfa743](https://github.com/andrewmcodes/obsidian-objects/commit/3cfa743eafe57d7b5b6a9e107a2240170838e5e5))

## [1.1.0](https://github.com/andrewmcodes/obsidian-objects/compare/1.0.0...1.1.0) (2026-06-18)


### Features

* add advanced schema validation rules (pattern, min/max, email/url) ([ae41c33](https://github.com/andrewmcodes/obsidian-objects/commit/ae41c33737909a4a72e8be295d79c7453ec4d09a))
* add card view to generated Bases ([c3df00c](https://github.com/andrewmcodes/obsidian-objects/commit/c3df00cc163f57041261f4d78f0b2cffb742aa4a))
* add custom per-schema object actions ([42a71e9](https://github.com/andrewmcodes/obsidian-objects/commit/42a71e9b51f31cc2b217a363a51770bd8ccdffa5))
* add folder autocomplete to folder settings ([7c5a889](https://github.com/andrewmcodes/obsidian-objects/commit/7c5a88914dcdb39eaa461c317d62305a568de533))
* add link, multilink, email, and url property types ([eae0d95](https://github.com/andrewmcodes/obsidian-objects/commit/eae0d95742bf73ae6e73b82bfdd0230a3e18978a))
* add note/wikilink autocomplete to link and multilink inputs ([7bfef1f](https://github.com/andrewmcodes/obsidian-objects/commit/7bfef1f73277fc7feb2304470908d25dfcd50e0e))
* add objects dashboard view ([bc7ca0a](https://github.com/andrewmcodes/obsidian-objects/commit/bc7ca0ab692f67b406d65798e092304f65974a02))
* add schema import and export ([732d6f2](https://github.com/andrewmcodes/obsidian-objects/commit/732d6f28e57ae336ff858a0c4322834ab0ecc9af))
* implement schema-driven object notes, modals, settings, and commands ([44d9b8b](https://github.com/andrewmcodes/obsidian-objects/commit/44d9b8b2a39ef7ed268a0e2093f59417421197d5))
* scope link/multilink autocomplete to an optional linked type ([f4a4c69](https://github.com/andrewmcodes/obsidian-objects/commit/f4a4c69b53d4accd4779b6954f50bc08a708b26a))
* support multiple body templates per schema ([229c7a7](https://github.com/andrewmcodes/obsidian-objects/commit/229c7a75f9b993d523315146dfe159315e0479a2))


### Bug Fixes

* expand ~ and require absolute path in install-plugin task ([f05c288](https://github.com/andrewmcodes/obsidian-objects/commit/f05c28829ab8c7e6e969fff33ccc64fe1b64b2bc))
* target Obsidian 1.13 and use non-deprecated settings API ([1733f0f](https://github.com/andrewmcodes/obsidian-objects/commit/1733f0f017f17d267b112e4febfdc7e5e95d3d39))


### Reverts

* drop local prettier.config.js (prose wrapping handled globally, not per-repo) ([df1b404](https://github.com/andrewmcodes/obsidian-objects/commit/df1b404107ed6f5f4ecc643466008ff32178dff9))
