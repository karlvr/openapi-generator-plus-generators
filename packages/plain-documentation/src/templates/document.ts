import { maybe, ts } from '@openapi-generator-plus/template-utils'
import { e } from './helpers'
import { DocumentContext, PlainDocumentationHooks } from './types'
import { pageBody, pageFooter, pageHeader } from './base'

/**
 * Render the complete `index.html` page for the API document: the standard
 * head (styles, scripts, and any hook-supplied additions) followed by the
 * header, body and footer.
 */
export function documentTemplate(doc: DocumentContext, hooks: PlainDocumentationHooks): string {
	return ts`<!DOCTYPE html>
<!--[if lt IE 7 ]> <html lang="en" class="ie6 lte9 lte8 lte7 lte6"> <![endif]-->
<!--[if IE 7 ]>    <html lang="en" class="ie7 lte9 lte8 lte7"> <![endif]-->
<!--[if IE 8 ]>    <html lang="en" class="ie8 lte9 lte8"> <![endif]-->
<!--[if IE 9 ]>    <html lang="en" class="ie9 lte9"> <![endif]-->
<!--[if (gt IE 9)|!(IE)]><!--> <html id="html" lang="en" class="no-js"> <!--<![endif]-->

<head>
\t<title>${e(doc.info.title)}</title>

\t<meta charset="UTF-8">
\t<meta name="viewport" content="width=device-width, initial-scale=1.0" />
\t<meta name="apple-mobile-web-app-title" content="${e(doc.info.title)}" />
\t<meta name="application-name" content="${e(doc.info.title)}" />

\t<link href="static/css/main.css" rel="stylesheet" />
\t<link href="static/css/custom.css" rel="stylesheet" />
\t<link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono&display=swap" rel="stylesheet" />


\t<script src="static/js/jquery-3.4.1.min.js"></script>
\t<script src="static/js/jquery.sticky-kit.min.js"></script>
\t<script src="static/js/constants.js"></script>
\t<script>
\t\t$(function() {
\t\t\tif ($(window).width() > SIDEBAR_MIN_PAGEWIDTH) {
\t\t\t\t$("#sidebar").stick_in_parent();
\t\t\t}

\t\t\t$("#sidebar .expandable").on("click", ".endpoint", function(e) {
\t\t\t\te.preventDefault();
\t\t\t\tvar count = $(this).siblings("section").children("div").length;
\t\t\t\t$(this).siblings("section").slideToggle(Math.max((count * 50), 200));
\t\t\t});

\t\t\t$('.example-trigger').each(function() {
\t\t\t\tvar $trigger = $(this);
\t\t\t\tvar $target = $trigger.closest('tr').next('tr').filter('.examples');
\t\t\t\tif (!$target) {
\t\t\t\t\t$target = $trigger.closest('p').next('div').filter('.examples');
\t\t\t\t}

\t\t\t\tif ($target) {
\t\t\t\t\t$target.hide();
\t\t\t\t\t$trigger.on('click', function(evt) {
\t\t\t\t\t\tevt.preventDefault();
\t\t\t\t\t\t$target.toggle();
\t\t\t\t\t});
\t\t\t\t}
\t\t\t});

\t\t\t$("body").removeClass("before-js");
\t\t});
\t</script>

\t<noscript>
\t\t<style>body.before-js .page-bg * { visibility: visible !important; }</style>
\t</noscript>
${maybe(hooks.head?.(doc))}
</head>

<body class="api-docs before-js">
\t<div class="page-bg">
\t\t<div class="page">
${pageHeader(doc.info)}

${pageBody(doc, hooks)}

${pageFooter()}
\t\t</div>
\t</div>
</body>

</html>
`
}
