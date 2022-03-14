// var Obj = {
//     loop: false,
//     // minDisplayTime: 0,// アニメーションの間隔時間
//     initialDelay: 50, // アニメーション開始までの遅延時間
//     autoStart: true,
//     in: {
//     effect: 'fadeInUp',//animate.css の中にある採用したい動きのクラス名
//     delayScale: 1,// 遅延時間の指数
//     delay: 50,// 文字ごとの遅延時間
//     sync: false,// アニメーションをすべての文字に同時適用するかどうか
//     shuffle: true,// 文字表示がランダムな順に表示されるかどうか
//     },
//     out: {// 終了時のアニメーション設定をしたい場合はここに追記
//     }
//     }

// 変数定義
var element= $(".randomAnime");
var randoms =[];

// //初期設定
// function RandomInit() {
//     // element
//     // $(element[0]).textillate(Obj);
//     }


    
function RandomAnimeControl() { 
    // for(let j = 0; j<=element.length; j++){
        // rum = 0;
    while (randoms.length <= element.length){
    rum =Math.floor(Math.random()*element.length);
    if(!randoms.includes(rum)){
        randoms.push(rum);
    }
    else {
        break;
    }
    }
    
    for (let i = 0; i<=element.length; i++) {
        // // <span> 要素を生成
        // var span = document.createElement("span");
        // // クラス名を指定
        // span.className = ".randomAnime"; 
        // // ランダム位置に配置
        // span.style.left = ( Math.random()*100 )+"%";
        // span.style.top =( Math.random()*100 )+"%";
        // // ランダム角度（ -60°～60° の範囲に設定してある ）
        // span.style.transform = "rotate("+( ( Math.random()*120 )-60 )+"deg)";

        var Obj = {                   
            // ctx.fillText([i%5], x, y, 200), // (文字,始点x,y,最大横幅)に文字を描画
            loop: false,
            // minDisplayTime: 100,// アニメーションの間隔時間
            initialDelay: 50+i*500, // アニメーション開始までの遅延時間
            autoStart: true,
            in: {
            effect: 'fadeInUp',//animate.css の中にある採用したい動きのクラス名
            delayScale: 1,// 遅延時間の指数
            // delay: 50,// 文字ごとの遅延時間
            sync: true,// アニメーションをすべての文字に同時適用するかどうか
            // shuffle: true,// 文字表示がランダムな順に表示されるかどうか
            },
            // out: {// 終了時のアニメーション設定をしたい場合はここに追記
            // }
            }
        $(element[randoms[i]]).textillate(Obj);
        }

    };

// 画面が読み込まれたらすぐに動かしたい場合の記述
$(window).on('load', function () {
    // RandomInit(); /*初期設定を読み込み*/
    RandomAnimeControl();/*アニメーション用の関数を呼ぶ*/
    });//ここまで画面が読み込まれたらすぐに動かしたい場合の記述



    
// ボタンテキスト表示
// document.getElementById("text-button").onclick = function() {
    //   };
