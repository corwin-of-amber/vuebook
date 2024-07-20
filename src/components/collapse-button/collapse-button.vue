<template>
    <button class="collapsible" @click="toggle">
        <span class="material-icons">
            {{ collapsed ? 'expand_more' : 'expand_less' }}
        </span>
    </button>
</template>

<script lang="ts">
import {Component, Prop, toNative, Vue} from "vue-facing-decorator";

@Component
class CollapseButton extends Vue {
    @Prop toggle
    @Prop collapsed: boolean
}

export default toNative(CollapseButton);

</script>

<style lang="scss" scoped>
@import 'material-design-icons-iconfont/dist/material-design-icons-no-codepoints.min.css';

.collapsible {
    background-color: transparent;
    color: white;
    cursor: pointer;
    padding-left: 3px;
    border: none;
    text-align: left;
    outline: none;
    font-size: 18px;
}
</style>