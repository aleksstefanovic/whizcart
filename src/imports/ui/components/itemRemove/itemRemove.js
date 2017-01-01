import angular from 'angular'
import angularMeteor from 'angular-meteor';
import template from './itemRemove.html';
import {Items} from '../../../api/items/index';

class ItemRemove{
	remove(){
		if (this.item) {
			Items.remove(this.item._id);
		}
	}
}

const name = 'itemRemove';

export default angular.module(name, [angularMeteor])
	.component(name,{
		template,
		bindings: {
			item: '<'
		},
		controllerAs: name,
		controller: ItemRemove
	});