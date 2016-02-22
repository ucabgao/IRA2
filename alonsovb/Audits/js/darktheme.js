$(document).ready(function(){
	$('#theme-picker').hover(function(){
		$(this).animate({
			marginLeft: "0px"
		},300)
	});
	$('#theme-picker').mouseleave(function(){
		$(this).animate({
			marginLeft: "-45px"
		},300);
	});
	// on click over theme picker, pages change theme to theme-c (jquerymobile.css)
	$('.theme').click(function(){
		pages = ['#login','#main','#history','#audit','#create'];
		for(i=0;i<pages.length;i++){
			$(pages[i]).removeClass('ui-body-a ui-body-b ui-body-c ui-body-d ui-body-e').addClass('ui-body-a').attr('data-theme','a');
		}
		$('.panel').css('border','1px solid rgba(255, 255, 255, 0.52)');
		$('#login .content-box').css('background-color', 'rgba(26, 162, 238, 0.38)').css('border','1px solid rgb(248, 248, 248)').css('margin-top','0px').css('padding','15px');
		$('#audit .content-box').css('border','1px solid rgba(255, 255, 255, 0.20)');
		$('#logo-wrapper').hide();
		$('#logo-theme-a').show();
		$('#theme-picker').hide();
	});
});