# 数据导入导出

从 TabClip 导出数据，或是向 TabClip 导入数据，支持导入从 Onetab 导出的数据。

## 从 Onetab 导入数据

::: warning
注意: Onetab 导出的数据默认是文本格式，只有 url 和 title 信息，分组和时间信息丢失。所以需要借助相关工具导出 Onetab 的完整数据，具体见链接 [onetab-to-json](https://github.com/Heaciy/onetab-to-json)，借助该工具导出的数据为 JSON 文件，使用该 JSON 文件在 TabClip 上导入。
:::

## 从 TabClip 导入导出数据

::: info
注意：不管是导入从 Onetab 导出的数据，还是导入从 TabClip 导出的数据，再导入时都是采用增量更新不会重复导入，对于 ID 相同的数据会直接覆盖。
:::

点击导航栏的“更多操作”按钮，点击数据操作中的“导出/导入标签组”即可导出或导入数据，同时会有进度条显示当前操作进度。

::: warning
注意：从 TabClip 导出的数据可直接再导入到 TabClip，请不要随意修改导出后 JSON 文件的数据格式，如果改动破环了原有数据结构可能导致后续导入出错。
:::